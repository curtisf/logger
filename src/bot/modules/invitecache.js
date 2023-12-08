const aes = require('../../db/aes')

module.exports = {
  getCachedInvites: async (guildID) => {
    // Why linvites? So the bot doesn't error on old stored invites lmao
    const invites = await global.redis.get(`llinvites-${guildID}`)
    if (!invites) return []
    const decryptedCachedInvites = await Promise.all(JSON.parse(invites).map(async invite => {
      let decryptedInvite
      try {
        decryptedInvite = (await aes.decrypt([invite.code]))?.[0]
      } catch (e) {
        global.logger.error('Failed to decrypt invite', invite.code, e)
      }
      return {
        code: decryptedInvite,
        channel: invite.channel,
        uses: invite.uses
      }
    }))
    return decryptedCachedInvites
  },
  cacheInvitesWhole: async (guildID, invitesArray) => {
    await global.redis.del(`llinvites-${guildID}`)
    const allInvitesToInsert = JSON.stringify(await Promise.all(invitesArray.map(async i => await module.exports.formatInvite(i, true))))
    await global.redis.set(`llinvites-${guildID}`, allInvitesToInsert, 'EX', 10800000)
  },
  insertInvite: async (guildID, invite) => {
    const invites = await module.exports.getCachedInvites(guildID)
    if (!invites) {
      const newInvitesArray = JSON.stringify(await Promise.all([await module.exports.formatInvite(invite, true)]))
      await global.redis.set(`llinvites-${guildID}`, newInvitesArray, 'EX', 10800000)
    } else {
      invites.push(await module.exports.formatInvite(invite, false))
      await global.redis.set(`llinvites-${guildID}`, JSON.stringify(await Promise.all(invites.map(async i => await module.exports.formatInvite(i, true)))), 'EX', 10800000)
    }
  },
  deleteInvites: async (guildID) => {
    await global.redis.del(`llinvites-${guildID}`)
  },
  deleteInvite: async (guildID, code) => {
    const guildInvites = await module.exports.getCachedInvites(guildID)
    const inviteToDelete = guildInvites.find(i => i.code === code)
    if (!inviteToDelete) return // no more work to be done
    guildInvites.splice(guildInvites.indexOf(inviteToDelete), 1)
    const newInvites = JSON.stringify(await Promise.all(guildInvites.map(async i => { // pain
      i.code = (await aes.encrypt([code]))?.[0]
      return i
    })))
    await global.redis.set(`llinvites-${guildID}`, newInvites, 'EX', 10800000)
  },
  formatInvite: async (invite, doEncrypt) => { // strip useless info and only keep what I want
    if (!invite) throw new Error('Invite given to be stripped is null-ish')
    return {
      code: doEncrypt ? (await aes.encrypt([invite.code]))?.[0] : invite.code, // for formatting invites in guildMemberAdd
      channel: invite.channel && invite.channel.id, // lazy condition
      uses: `${invite.uses}${invite.maxUses ? `/${invite.maxUses}` : ''}`
    }
  }
}

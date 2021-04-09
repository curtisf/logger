const aes = require('../../db/aes')

module.exports = {
  getCachedInvites: async (guildID) => {
    // Why linvites? So the bot doesn't error on old stored invites lmao
    const invites = await global.redis.get(`linvites-${guildID}`)
    if (!invites) return []
    return JSON.parse(invites).map(invite => {
      return {
        code: aes.decrypt(invite.code),
        channel: invite.channel,
        uses: invite.uses
      }
    })
  },
  cacheInvitesWhole: async (guildID, invitesArray) => {
    await global.redis.del(`linvites-${guildID}`)
    await global.redis.set(`linvites-${guildID}`, JSON.stringify(invitesArray.map(i => module.exports.formatInvite(i, true))), 'EX', 10800000)
  },
  insertInvite: async (guildID, invite) => {
    const invites = await module.exports.getCachedInvites(guildID)
    if (!invites) {
      await global.redis.set(`linvites-${guildID}`, JSON.stringify([module.exports.formatInvite(invite, true)]), 'EX', 10800000)
    } else {
      invites.push(module.exports.formatInvite(invite, false))
      await global.redis.set(`linvites-${guildID}`, JSON.stringify(invites.map(i => module.exports.formatInvite(i, true))), 'EX', 10800000)
    }
  },
  deleteInvites: async (guildID) => {
    await global.redis.del(`linvites-${guildID}`)
  },
  deleteInvite: async (guildID, code) => {
    const guildInvites = await module.exports.getCachedInvites(guildID)
    const inviteToDelete = guildInvites.find(i => i.code === code)
    if (!inviteToDelete) return // no more work to be done
    guildInvites.splice(guildInvites.indexOf(inviteToDelete), 1)
    await global.redis.set(`linvites-${guildID}`, JSON.stringify(guildInvites.map(i => {
      i.code = aes.encrypt(code)
      return i
    })), 'EX', 10800000)
  },
  formatInvite: (invite, doEncrypt) => { // strip useless info and only keep what I want
    if (!invite) throw new Error('Invite given to be stripped is null-ish')
    return {
      code: doEncrypt ? aes.encrypt(invite.code) : invite.code, // for formatting invites in guildMemberAdd
      channel: invite.channel && invite.channel.id, // lazy condition
      uses: `${invite.uses}${invite.maxUses ? `/${invite.maxUses}` : ''}`
    }
  }
}

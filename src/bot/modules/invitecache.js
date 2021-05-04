const { runQuery } = require('../../db/interfaces/sqlite')

module.exports = {
  getCachedInvites: async (guildID) => {
    const invites = await runQuery('SELECT * FROM invites WHERE guild_id=$1', [guildID])
    if (invites.rows.length === 0) return []
    return JSON.parse(invites.rows[0].invites_array)
  },
  insertInvite: async (guildID, invite) => {
    const invites = await module.exports.getCachedInvites(guildID)
    invites.push(module.exports.formatInvite(invite))
    await module.exports.cacheInvites(guildID, invites)
  },
  deleteInvite: async (guildID, inviteCode) => {
    const invites = await module.exports.getCachedInvites(guildID)
    const toDelete = invites.find(i => i.code === inviteCode)
    if (!toDelete) return
    invites.splice(invites.indexOf(toDelete), 1)
    await module.exports.cacheInvites(guildID, invites)
  },
  cacheInvites: async (guildID, invitesArray) => {
    await runQuery('INSERT OR REPLACE INTO invites (guild_id, invites_array) VALUES ($1, $2)', [guildID, JSON.stringify(invitesArray)])
  },
  deleteInvites: async (guildID) => {
    await runQuery('DELETE FROM invites WHERE guild_id=$1', [guildID])
  },
  formatInvite: (invite) => { // strip useless info and only keep what I want
    if (!invite) throw new Error('Invite given to be stripped is null-ish')
    return {
      code: invite.code, // for formatting invites in guildMemberAdd
      channel: invite.channel && invite.channel.id, // lazy condition
      uses: `${invite.uses}${invite.maxUses ? `/${invite.maxUses}` : ''}`
    }
  }
}

const runQuery = require('../../db/interfaces/sqlite')

module.exports = {
  getCachedInvites: async (guildID) => {
    const invites = await runQuery('SELECT * FROM invites WHERE guild_id=$1', [guildID])
    if (invites.rows.length === 0) return []
    return invites
  },
  cacheInvites: async (guildID, invitesArray) => {
    await runQuery('INSERT INTO invites SET invites_array=$1 WHERE guild_id=$2', [invitesArray.map(JSON.stringify), guildID])
  },
  deleteInvites: async (guildID) => {
    await runQuery('DELETE FROM invites WHERE guild_id=$1', [guildID])
  }
}

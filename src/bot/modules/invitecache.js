const { runQuery } = require('../../db/interfaces/sqlite')

module.exports = {
  getCachedInvites: async (guildID) => {
    const invites = await runQuery('SELECT * FROM invites WHERE guild_id=$1', [guildID])
    if (invites.rows.length === 0) return []
    return invites
  },
  cacheInvites: async (guildID, invitesArray) => {
    await runQuery('INSERT OR REPLACE INTO invites (guild_id, invites_array) VALUES ($1, $2)', [guildID, invitesArray.map(JSON.stringify)])
  },
  deleteInvites: async (guildID) => {
    await runQuery('DELETE FROM invites WHERE guild_id=$1', [guildID])
  }
}

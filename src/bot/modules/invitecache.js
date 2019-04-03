module.exports = {
  getCachedInvites: async (guildID) => {
    let invites = await global.redis.get(`invites-${guildID}`)
    if (!invites) return []
    return JSON.parse(invites)
  },
  cacheInvites: async (guildID, invitesArray) => {
    await global.redis.del(`invites-${guildID}`)
    await global.redis.set(`invites-${guildID}`, JSON.stringify(invitesArray), 'EX', 10800000)
  },
  deleteInvites: async (guildID) => {
    await global.redis.del(`invites-${guildID}`)
  }
}

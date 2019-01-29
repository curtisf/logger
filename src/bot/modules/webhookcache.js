module.exports = {
  setWebhook: async (channelID, webhookID, webhookToken) => {
    return await global.redis.set(`webhook-${channelID}`, `${webhookID}|${webhookToken}`, 'EX', 10800000)
  },
  getWebhook: async (channelID) => {
    return await global.redis.get(`webhook-${channelID}`)
  },
  deleteWebhook: async (channelID) => {
    return await global.redis.del(`webhook-${channelID}`)
  }
}

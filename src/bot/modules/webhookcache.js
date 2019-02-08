module.exports = {
  setWebhook: (channelID, webhookID, webhookToken) => {
    return global.redis.set(`webhook-${channelID}`, `${webhookID}|${webhookToken}`, 'EX', 10800000)
  },
  getWebhook: channelID => {
    return global.redis.get(`webhook-${channelID}`)
  },
  deleteWebhook: channelID => {
    return global.redis.del(`webhook-${channelID}`)
  }
}

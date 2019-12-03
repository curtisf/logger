const statAggregator = require('./statAggregator')

module.exports = {
  setWebhook: (channelID, webhookID, webhookToken) => {
    statAggregator.incrementRedisSet()
    return global.redis.set(`webhook-${channelID}`, `${webhookID}|${webhookToken}`, 'EX', 10800000)
  },
  getWebhook: channelID => {
    statAggregator.incrementRedisGet()
    return global.redis.get(`webhook-${channelID}`)
  },
  deleteWebhook: channelID => {
    return global.redis.del(`webhook-${channelID}`)
  }
}

const webhookCache = require('../modules/webhookcache')

module.exports = {
  func: async message => {
    let cachedWebhook = await webhookCache.getWebhook(message.channel.id)
    if (!cachedWebhook) {
      let webhooks = await message.channel.guild.getWebhooks()
      let eventObj = global.bot.guildSettingsCache[message.channel.guild.id].getEventLogRaw()
      let keys = Object.keys(eventObj)
      let idsToCache = []
      keys.forEach((key) => {
        if (eventObj[key]) idsToCache.push(eventObj[key])
      })
      idsToCache.forEach((channelID) => {
        for (let i = 0; i < webhooks.length; i++) {
          if (webhooks[i].channel_id === channelID) {
            console.log('GOT MATCH')
            webhookCache.setWebhook(channelID, webhooks[i].id, webhooks[i].token)
            break
          }
        }
      })
    } else {
      let savedHookStuff = await global.redis.get(`webhook-${message.channel.id}`)
    }
  },
  name: 'setwebhook',
  description: 'set webhooks to redis, absolutely useless for now',
  type: 'creator',
  perm: 'manageWebhooks'
}

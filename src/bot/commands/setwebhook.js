const webhookCache = require('../modules/webhookcache')

module.exports = {
  func: async message => {
    const cachedWebhook = await webhookCache.getWebhook(message.channel.id)
    if (cachedWebhook) {
      let savedHookStuff = await global.redis.get(`webhook-${message.channel.id}`)
    } else {
      const webhooks = await message.channel.guild.getWebhooks()
      const eventObj = global.bot.guildSettingsCache[message.channel.guild.id].getEventLogRaw()
      const keys = Object.keys(eventObj)
      const idsToCache = []
      keys.forEach(key => {
        if (eventObj[key]) idsToCache.push(eventObj[key])
      })
      idsToCache.forEach(channelID => {
        for (let i = 0; i < webhooks.length; i++) {
          if (webhooks[i].channel_id === channelID) {
            console.log('GOT MATCH')
            webhookCache.setWebhook(channelID, webhooks[i].id, webhooks[i].token)
            break
          }
        }
      })
    }
  },
  name: 'setwebhook',
  description: 'set webhooks to redis, absolutely useless for now',
  type: 'creator',
  perm: 'manageWebhooks'
}

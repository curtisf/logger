const webhookCache = require('../modules/webhookcache')

module.exports = {
  func: async message => {
    let cachedWebhook = await webhookCache.getWebhook(message.channel.id)
    console.log(cachedWebhook)
    if (!cachedWebhook) {
      let webhooks = await message.channel.guild.getWebhooks()
      let eventObj = global.bot.guildSettingsCache[message.channel.guild.id].getEventLogRaw()
      let keys = Object.keys(eventObj)
      let idsToCache = []
      keys.forEach((key) => {
        if (eventObj[key]) idsToCache.push(eventObj[key])
      })
      console.log('ids to cache', idsToCache)
      idsToCache.forEach((channelID) => {
        for (let i = 0; i < webhooks.length; i++) {
          if (webhooks[i].channel_id === channelID) {
            console.log('GOT MATCH')
            webhookCache.setWebhook(channelID, webhooks[i].id, webhooks[i].token)
            break
          }
        }
      })
      console.log(webhooks.map(w => `${w.name} | ${w.channel_id}`))
    } else {
      console.log('Webhook is cached for this channel!')
      let savedHookStuff = await global.redis.get(`webhook-${message.channel.id}`)
      console.log(savedHookStuff)
    }
  },
  name: 'setwebhook',
  description: 'set webhooks to redis',
  type: 'creator',
  perm: 'manageWebhooks'
}

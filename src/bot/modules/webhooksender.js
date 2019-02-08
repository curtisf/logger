const webhookCache = require('./webhookcache')
const guildWebhookCacher = require('./guildWebhookCacher')

module.exports = async pkg => {
  if (!pkg.guildID) return global.logger.error('No guildID was provided in an embed!')

  const guildSettings = global.bot.guildSettingsCache[pkg.guildID]
  const webhook = await webhookCache.getWebhook(guildSettings.getEventByName(pkg.eventName))
  let webhookID, webhookToken
  if (webhook) {
    const split = webhook.split('|')
    webhookID = split[0]
    webhookToken = split[1]
  }
  if (!webhook && guildSettings.getEventByName(pkg.eventName)) {
    console.log('Try to get the hook')
    await guildWebhookCacher(pkg.guildID)
    return await setTimeout(() => {
      module.exports(pkg)
    }, 2000)
  } else if (webhook && !guildSettings.eventIsDisabled(pkg.eventName)) {
    console.log('Good.')
    if (!pkg.embed.footer) {
      pkg.embed.footer = {
        text: `${global.bot.user.username}#${global.bot.user.discriminator}`,
        icon_url: global.bot.user.avatarURL
      }
    }
    if (!pkg.embed.timestamp) pkg.embed.timestamp = new Date()
    global.bot.executeWebhook(webhookID, webhookToken, {
      file: pkg.file ? pkg.file : '',
      username: global.bot.user.username,
      avatarURL: global.bot.user.avatarURL,
      embeds: [pkg.embed]
    }).catch(async e => {
      if (e.code === 10015) { // Webhook doesn't exist anymore.
        await global.redis.del(`webhook-${guildSettings.getEventByName(pkg.eventName)}`)
        return await guildWebhookCacher(pkg.guildID)
      } else {
        console.error(e)
      }
    })
  } else console.log('Cache the webhook.')
}

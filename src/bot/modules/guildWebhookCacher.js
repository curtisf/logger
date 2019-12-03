const webhookCache = require('./webhookcache')
const clearEventByID = require('../../db/interfaces/postgres/update').clearEventByID
const statAggregator = require('./statAggregator')
const cacheGuild = require('../utils/cacheGuild')

module.exports = async (guildID, channelID) => {
  const perms = global.bot.guilds.get(guildID).members.get(global.bot.user.id).permission.json
  if (!perms['manageWebhooks']) {
    return
  }
  const guild = global.bot.guilds.get(guildID)
  if (!guild) {
    return
  }
  let logChannel
  try {
    logChannel = global.bot.getChannel(channelID)
  } catch (_) {
    global.logger.warn(`Logchannel ${channelID} in ${global.bot.guilds.get(guildID).name} ${guildID} does not exist`)
    await global.redis.del(`webhook-${channelID}`)
    global.bot.guildSettingsCache[guildID].clearEventByID(channelID)
    await clearEventByID(guildID, channelID)
    await cacheGuild(guildID)
    return
  }
  const webhooks = await global.bot.guilds.get(guildID).getWebhooks()
  statAggregator.incrementMisc('fetchWebhooks')
  for (let i = 0; i < webhooks.length; i++) {
    if (webhooks[i].token && webhooks[i].channel_id === channelID) { // check for token because channel subscriptions count as webhooks
      webhookCache.setWebhook(channelID, webhooks[i].id, webhooks[i].token)
      global.logger.info(`G: ${guildID} C: ${channelID} found hook ${webhooks[i].id}, set cache`)
      return
    }
  }
  statAggregator.incrementMisc('createWebhook')
  global.logger.info(`Create hook > C: ${channelID} G: ${guildID} `)
  if (!logChannel) {
    global.logger.warn(`Logchannel ${channelID} in ${global.bot.guilds.get(guildID).name} ${guildID} does not exist low`)
    await global.redis.del(`webhook-${channelID}`)
    global.bot.guildSettingsCache[guildID].clearEventByID(channelID)
    await clearEventByID(guildID, channelID)
    await cacheGuild(guildID)
    return
  } else {
    const newHook = await logChannel.createWebhook({
      name: global.bot.user.username,
      avatar: 'data:image/jpeg;base64,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'
    }, `Automated webhook creation.`).catch((e) => {
      // With permission checking, this can only trigger if Discord sends a 500 error code OR
      // the user hit the guild webhook limit. The best action is to leave because the bot
      // doesn't know who to contact when this occurs (owner? staff?)
      global.bot.guilds.get(guildID).leave()
      global.webhook.warn(`Leaving guild ${guildID} (${global.bot.guilds.get(guildID).name}, ${global.bot.guilds.get(guildID).memberCount}) because of an error: ${e.message}`)
    })
    if (newHook && newHook.id) {
      global.logger.info(`Webhook made in ${guildID} for ${channelID}`)
    await webhookCache.setWebhook(channelID, newHook.id, newHook.token)
    await cacheGuild(guildID)
    } else {
      console.log(newHook)
      global.logger.warn('Webhook "created" is invalid, please inspect')
    }
  }
}

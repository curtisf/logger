const webhookCache = require('./webhookcache')
const clearEventByID = require('../../db/interfaces/postgres/update').clearEventByID
const statAggregator = require('./statAggregator')
const cacheGuild = require('../utils/cacheGuild')

const logChannelLocks = {}

module.exports = async (guildID, channelID) => {
  if (!global.bot.guilds.get(guildID)) return // if not in that guild anymore, stop.
  const perms = global.bot.getChannel(channelID)?.permissionsOf(global.bot.user.id).json
  if (!perms || !perms.manageWebhooks) {
    return
  }
  const guild = global.bot.guilds.get(guildID)
  if (!guild) {
    return
  }
  if (logChannelLocks[channelID]) {
    return
  } else {
    logChannelLocks[channelID] = true
    setTimeout(() => {
      delete logChannelLocks[channelID]
    }, 30000) // release cacher after 30 seconds for a guild
  }
  let logChannel
  try {
    logChannel = global.bot.getChannel(channelID)
  } catch (_) {
    global.logger.warn(`Logchannel ${channelID} in ${guildID} does not exist`)
    await global.redis.del(`webhook-${channelID}`)
    global.bot.guildSettingsCache[guildID].clearEventByID(channelID)
    await clearEventByID(guildID, channelID)
    await cacheGuild(guildID)
    return
  }
  let webhooks
  try {
    webhooks = await logChannel?.getWebhooks()
    statAggregator.incrementMisc('fetchWebhooks')
  } catch (_) {
    global.logger.warn(`Logchannel ${channelID} in ${guildID} does not exist even though it is in cache`)
    await global.redis.del(`webhook-${channelID}`)
    global.bot.guildSettingsCache[guildID].clearEventByID(channelID)
    await clearEventByID(guildID, channelID)
    await cacheGuild(guildID)
    return
  }
  for (let i = 0; i < webhooks.length; i++) {
    if (webhooks[i].token && webhooks[i].channel_id === channelID && webhooks[i].application_id === global.bot.user.id) { // check for token because channel subscriptions count as webhooks
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
  } else {
    const newHook = await logChannel.createWebhook({
      name: 'Loggerbot Utility Webhook',
      avatar: ' data:image/png;base64,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'
    }, 'Automated webhook creation.').catch((e) => {
      // With permission checking, this can only trigger if Discord sends a 500 error code OR
      // the user hit the guild webhook limit. The best action is to leave because the bot
      // doesn't know who to contact when this occurs (owner? staff?)
      // global.bot.guilds.get(guildID).leave() comment this out for now
      // it may be uncommented out when I'm certain it won't
      // throw an error on prod and leave thousands of servers
      // global.webhook.warn(`Leaving guild ${guildID} (${global.bot.guilds.get(guildID).name}, ${global.bot.guilds.get(guildID).memberCount}) because of an error: ${e.message}`)
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

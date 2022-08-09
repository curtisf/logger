const { EVENTS_USING_AUDITLOGS } = require('../utils/constants')
const webhookCache = require('./webhookcache')
const guildWebhookCacher = require('./guildWebhookCacher')
const cacheGuild = require('../utils/cacheGuild')
const statAggregator = require('./statAggregator')
const enqueue = require('./bulkqueue')
const setEventsByChannelID = require('../../db/interfaces/postgres/update').setEventsLogId

// const doNotAggregate = ['voiceStateUpdate', 'voiceChannelLeave', 'voiceChannelSwitch', 'guildMemberVerify']
// these three events could possibly be an audit log fetch in the future, so they must be recorded together
// update: debug, see what is doing what

const doNotAggregate = [
  'disconnect',
  'error',
  'interactionCreate',
  'inviteCreate',
  'inviteDelete',
  'warn'
]

module.exports = async pkg => {
  if (!pkg.guildID) return global.logger.error('No guildID was provided in an embed!')
  if (!pkg.embeds[0].color) pkg.embeds[0].color = 3553599 // todo: make a function to check all the following logic for EACH embed, not just the first
  const guild = global.bot.guilds.get(pkg.guildID)
  if (!guild) {
    console.error('Invalid guild ID sent in package!', pkg.guildID, pkg, pkg.embeds)
    // global.webhook.warn(`Invalid guild ID sent in package! ${pkg.guildID} (I am not a member anymore!)`)
    return
  }
  const guildSettings = global.bot.guildSettingsCache[pkg.guildID]
  if (!guildSettings) {
    await cacheGuild(pkg.guildID)
    return
  }
  if (!guildSettings.getEventByName(pkg.eventName)) return
  if (!global.bot.getChannel(guildSettings.getEventByName(pkg.eventName))) {
    await global.redis.del(`webhook-${guildSettings.getEventByName(pkg.eventName)}`)
    await setEventsByChannelID(pkg.guildID, '', [pkg.eventName])
    await cacheGuild(pkg.guildID)
  }
  if (!global.bot.getChannel(guildSettings.getEventByName(pkg.eventName))?.permissionsOf(global.bot.user.id).json.manageWebhooks || !global.bot.getChannel(guildSettings.getEventByName(pkg.eventName)).permissionsOf(global.bot.user.id).json.viewAuditLog) return
  const webhook = await webhookCache.getWebhook(guildSettings.getEventByName(pkg.eventName))
  let webhookID, webhookToken
  if (webhook) {
    const split = webhook.split('|')
    webhookID = split[0]
    webhookToken = split[1]
  }
  if (!webhook && guildSettings.getEventByName(pkg.eventName)) {
    await guildWebhookCacher(pkg.guildID, guildSettings.getEventByName(pkg.eventName))
  } else if (webhook && !guildSettings.eventIsDisabled(pkg.eventName)) {
    if (!pkg.embeds[0].footer && !pkg.noFooter) {
      pkg.embeds[0].footer = {
        text: `${global.bot.user.username}#${global.bot.user.discriminator}`,
        icon_url: global.bot.user.avatarURL
      }
    }
    if (!pkg.embeds[0].timestamp) {
      pkg.embeds[0].timestamp = new Date()
    }

    statAggregator.incrementGuild(pkg.guildID)
    if (!doNotAggregate.includes(pkg.eventName)) {
      statAggregator.incrementEvent(pkg.eventName)
    }
    if (EVENTS_USING_AUDITLOGS.includes(pkg.eventName)) {
      statAggregator.incrementMisc('fetchAuditLogs')
    }

    // Thanks for the help, De Morgan's laws.
    if (guild.memberCount < 10000 && guild.voiceStates.size < 100) {
      global.bot.executeWebhook(webhookID, webhookToken, {
        file: pkg.file ? pkg.file : '',
        username: global.bot.user.username,
        avatarURL: global.bot.user.avatarURL,
        embeds: pkg.embeds,
        allowedMentions: { // even though this is an embed and cannot ping, why not
          everyone: false,
          roles: false,
          users: false
        }
      }).catch(async e => {
        if (e && e.message && (e.message.includes('Request timed out') || e.message.includes('503 Service Temporarily') || e.message.includes('Internal Server Error'))) return
        if (e && e.code && !(e.code == '50035' || e.code == '10015' || e.code == '500' || e.code == '503' || (e && e.message && e.message.includes('Internal Server Error')))) {
          global.logger.warn(`Got ${e.code} while sending webhook to ${pkg.guildID} (${global.bot.guilds.get(pkg.guildID) ? global.bot.guilds.get(pkg.guildID).name : 'Could not find guild!'})`)
          // global.webhook.warn(`Got ${e.code} while sending webhook to ${pkg.guildID} (${global.bot.guilds.get(pkg.guildID) ? global.bot.guilds.get(pkg.guildID).name : 'Could not find guild!'})`)
        }
        if (e.code == '10015') { // Webhook doesn't exist anymore.
          await global.redis.del(`webhook-${guildSettings.getEventByName(pkg.eventName)}`)
          return await guildWebhookCacher(pkg.guildID, guildSettings.getEventByName(pkg.eventName))
        } else {
          global.logger.error('Error while sending a message over webhook!', e, pkg, pkg.embeds[0].fields)
        }
      })
    } else {
      pkg.webhookID = webhookID
      pkg.webhookToken = webhookToken
      enqueue(pkg, guildSettings)
    }
  }
}

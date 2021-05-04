const { EVENTS_USING_AUDITLOGS } = require('../utils/constants')
const webhookCache = require('./webhookcache')
const guildWebhookCacher = require('./guildWebhookCacher')
const cacheGuild = require('../utils/cacheGuild')
const statAggregator = require('./statAggregator')
const enqueue = require('./bulkqueue')
const setEventsByChannelID = require('../../db/interfaces/sqlite').setEventsLogId

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
  if (!pkg.guildID) return console.error('No guildID was provided in an embed!')
  if (!pkg.embed.color) pkg.embed.color = 3553599
  const guild = global.bot.guilds.get(pkg.guildID)
  if (!guild) {
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
    if (!pkg.embed.footer) {
      pkg.embed.footer = {
        text: `${global.bot.user.username}#${global.bot.user.discriminator}`,
        icon_url: global.bot.user.avatarURL
      }
    }
    if (!pkg.embed.timestamp) {
      pkg.embed.timestamp = new Date()
    }

    // Thanks for the help, De Morgan's laws.
    if (guild.memberCount < 10000 && guild.voiceStates.size < 1000) {
      global.bot.executeWebhook(webhookID, webhookToken, {
        file: pkg.file ? pkg.file : '',
        username: global.bot.user.username,
        avatarURL: global.bot.user.avatarURL,
        embeds: [pkg.embed],
        allowedMentions: { // even though this is an embed and cannot ping, why not
          everyone: false,
          roles: false,
          users: false
        }
      }).catch(async e => {
        if (e && e.message && e.message.includes('Request timed out')) return
        if (e && e.code && !(e.code == '50035' || e.code == '10015' || e.code == '500' || e.code == '503' || (e && e.message && e.message.includes('Internal Server Error')))) {
          global.logger.warn(`Got ${e.code} while sending webhook to ${pkg.guildID} (${global.bot.guilds.get(pkg.guildID) ? global.bot.guilds.get(pkg.guildID).name : 'Could not find guild!'})`)
          global.signale.warn(`Got ${e.code} while sending webhook to ${pkg.guildID} (${global.bot.guilds.get(pkg.guildID) ? global.bot.guilds.get(pkg.guildID).name : 'Could not find guild!'})`)
        }
        if (e.code == '10015') { // Webhook doesn't exist anymore.
          await global.redis.del(`webhook-${guildSettings.getEventByName(pkg.eventName)}`)
          return await guildWebhookCacher(pkg.guildID, guildSettings.getEventByName(pkg.eventName))
        } else {
          console.error('Error while sending a message over webhook!', e, pkg, pkg.embed.fields)
        }
      })
    } else {
      pkg.webhookID = webhookID
      pkg.webhookToken = webhookToken
      enqueue(pkg, guildSettings)
    }
    // statAggregator.incrementGuild(pkg.guildID)
    if (!doNotAggregate.includes(pkg.eventName)) {
      statAggregator.incrementEvent(pkg.eventName)
    }
    if (EVENTS_USING_AUDITLOGS.includes(pkg.eventName)) {
      statAggregator.incrementMisc('fetchAuditLogs')
    }
  }
}

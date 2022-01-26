const cacheGuild = require('../utils/cacheGuild')
const guildWebhookCacher = require('./guildWebhookCacher')
const setEventsByChannelID = require('../../db/interfaces/postgres/update').setEventsLogId

const webhookIDToQueue = new Map()
const webhookIDToTimeout = new Map()
const webhookIDToCharLimit = new Map()

module.exports = async (senderPkg, guildSettings) => {
  if (webhookIDToQueue.has(senderPkg.webhookID)) {
    const updatedQueue = webhookIDToQueue.get(senderPkg.webhookID)
    const charsToPush = getEmbedCharLens(senderPkg.embeds)
    if (updatedQueue.length < 10 && webhookIDToCharLimit.get(senderPkg.webhookID) + charsToPush <= 5000) {
      updatedQueue.push(senderPkg)
      webhookIDToCharLimit.set(senderPkg.webhookID, webhookIDToCharLimit.get(senderPkg.webhookID) + charsToPush)
      webhookIDToQueue.set(senderPkg.webhookID, updatedQueue)
      clearTimeout(webhookIDToTimeout.get(senderPkg.webhookID))
      webhookIDToTimeout.set(senderPkg.webhookID, setTimeout(() => {
        sendBulkLog(senderPkg, webhookIDToQueue.get(senderPkg.webhookID).map(p => p.embeds).flat(1), guildSettings)
        webhookIDToQueue.delete(senderPkg.webhookID)
        webhookIDToTimeout.delete(senderPkg.webhookID)
        webhookIDToCharLimit.delete(senderPkg.webhookID)
      }, 5000))
    } else if (updatedQueue.length === 10 || webhookIDToCharLimit.get(senderPkg.webhookID) + charsToPush >= 5000) { // the limit is 6000 but let's be safe
      // queue is full, send log now.
      sendBulkLog(senderPkg, updatedQueue.map(p => p.embeds).flat(1), guildSettings)
      webhookIDToQueue.set(senderPkg.webhookID, [senderPkg])
      clearTimeout(webhookIDToTimeout.get(senderPkg.webhookID))
      webhookIDToCharLimit.set(senderPkg.webhookID, getEmbedCharLens(senderPkg.embeds))
      webhookIDToTimeout.set(senderPkg.webhookID, setTimeout(() => {
        sendBulkLog(senderPkg, webhookIDToQueue.get(senderPkg.webhookID).map(p => p.embeds).flat(1), guildSettings)
        webhookIDToQueue.delete(senderPkg.webhookID)
        webhookIDToTimeout.delete(senderPkg.webhookID)
        webhookIDToCharLimit.delete(senderPkg.webhookID)
      }, 5000))
    }
  } else {
    webhookIDToQueue.set(senderPkg.webhookID, [senderPkg])
    webhookIDToCharLimit.set(senderPkg.webhookID, getEmbedCharLens(senderPkg.embeds))
    clearTimeout(webhookIDToTimeout.get(senderPkg.webhookID))
    webhookIDToTimeout.set(senderPkg.webhookID, setTimeout(() => {
      sendBulkLog(senderPkg, webhookIDToQueue.get(senderPkg.webhookID).map(p => p.embeds).flat(1), guildSettings)
      webhookIDToQueue.delete(senderPkg.webhookID)
      webhookIDToTimeout.delete(senderPkg.webhookID)
      webhookIDToCharLimit.delete(senderPkg.webhookID)
    }, 5000))
  }
}

function getEmbedCharLens (embeds) {
  let total = 0
  embeds.forEach(embed => {
    for (const prop in embed) {
      if (typeof embed[prop] === 'string') {
        total += embed[prop].length
      }
    }
    for (let i = 0; i < (embed.fields ? embed.fields.length : 0); i++) {
      if (typeof embed.fields[i].name === 'string') {
        total += embed.fields[i].name.length
      }
      if (typeof embed.fields[i].value === 'string') {
        total += embed.fields[i].value.length
      }
    }
  })
  return total > 6000 ? 1000 : total // if the char len of these embeds is greater than the max for all embeds in a single message
  // return 1000 so it can silently fail (I have a TODO for this!)
}

function sendBulkLog (senderPkg, embeds, guildSettings) {
  global.bot.executeWebhook(senderPkg.webhookID, senderPkg.webhookToken, {
    file: senderPkg.file ? senderPkg.file : '',
    username: global.bot.user.username,
    avatarURL: global.bot.user.avatarURL,
    embeds: embeds,
    allowedMentions: { // even though this is an embed and cannot ping, why not
      everyone: false,
      roles: false,
      users: false
    }
  }).catch(async e => {
    if (e && e.message && e.message.includes('Request timed out')) return
    if (e && e.code && !(e.code == '50035' || e.code == '10015' || e.code == '500')) {
      global.logger.warn(`Got ${e.code} while sending webhook to ${senderPkg.guildID} (${global.bot.guilds.get(senderPkg.guildID) ? global.bot.guilds.get(senderPkg.guildID).name : 'Could not find guild!'})`)
      // global.webhook.warn(`Got ${e.code} while sending webhook to ${senderPkg.guildID} (${global.bot.guilds.get(senderPkg.guildID) ? global.bot.guilds.get(senderPkg.guildID).name : 'Could not find guild!'})`)
    }
    if (e.code == '10015') { // Webhook doesn't exist anymore.
      await global.redis.del(`webhook-${guildSettings.getEventByName(senderPkg.eventName)}`)
      await setEventsByChannelID(senderPkg.guildID, '', [senderPkg.eventName])
      await cacheGuild(senderPkg.guildID)
      return await guildWebhookCacher(senderPkg.guildID, guildSettings.getEventByName(senderPkg.eventName))
    } else {
      console.error('Error while sending a message over webhook!', e, senderPkg, senderPkg.embeds[0].fields)
    }
  })
}

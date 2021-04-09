const guildWebhookCacher = require('./guildWebhookCacher')

const webhookIDToQueue = new Map()
const webhookIDToTimeout = new Map()

module.exports = async (senderPkg, guildSettings) => {
  if (webhookIDToQueue.has(senderPkg.webhookID)) {
    const updatedQueue = webhookIDToQueue.get(senderPkg.webhookID)
    updatedQueue.push(senderPkg)
    webhookIDToQueue.set(senderPkg.webhookID, updatedQueue)
    clearTimeout(webhookIDToTimeout.get(senderPkg.webhookID))
    webhookIDToTimeout.set(senderPkg.webhookID, setTimeout(() => {
      sendBulkLog(senderPkg, webhookIDToQueue.get(senderPkg.webhookID).map(p => p.embed), guildSettings)
      webhookIDToQueue.delete(senderPkg.webhookID)
      webhookIDToTimeout.delete(senderPkg.webhookID)
    }, 1000))
    if (updatedQueue.length === 10) {
      // queue is full, send log now.
      sendBulkLog(senderPkg, updatedQueue.map(p => p.embed), guildSettings)
      webhookIDToQueue.delete(senderPkg.webhookID)
      clearTimeout(webhookIDToTimeout.get(senderPkg.webhookID))
      webhookIDToTimeout.delete(senderPkg.webhookID)
    }
  } else {
    webhookIDToQueue.set(senderPkg.webhookID, [senderPkg])
    clearTimeout(webhookIDToTimeout.get(senderPkg.webhookID))
    webhookIDToTimeout.set(senderPkg.webhookID, setTimeout(() => {
      sendBulkLog(senderPkg, webhookIDToQueue.get(senderPkg.webhookID).map(p => p.embed), guildSettings)
      webhookIDToQueue.delete(senderPkg.webhookID)
      webhookIDToTimeout.delete(senderPkg.webhookID)
    }, 1000))
  }
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
    if (e && e.code && !(e.code == '50035' || e.code == '10015' || e.code == '500')) {
      global.logger.warn(`Got ${e.code} while sending webhook to ${senderPkg.guildID} (${global.bot.guilds.get(senderPkg.guildID) ? global.bot.guilds.get(senderPkg.guildID).name : 'Could not find guild!'})`)
      global.webhook.warn(`Got ${e.code} while sending webhook to ${senderPkg.guildID} (${global.bot.guilds.get(senderPkg.guildID) ? global.bot.guilds.get(senderPkg.guildID).name : 'Could not find guild!'})`)
    }
    if (e.code == '10015') { // Webhook doesn't exist anymore.
      await global.redis.del(`webhook-${guildSettings.getEventByName(senderPkg.eventName)}`)
      return await guildWebhookCacher(senderPkg.guildID, guildSettings.getEventByName(senderPkg.eventName))
    } else {
      console.error('Error while sending a message over webhook!', e, senderPkg, senderPkg.embed.fields)
    }
  })
}

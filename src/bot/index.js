const Eris = require('eris')
const raven = require('raven')
const indexCommands = require('../miscellaneous/commandIndexer')
const listenerIndexer = require('../miscellaneous/listenerIndexer')
const getCacheInfo = require('./utils/getCacheInfo')
const cacheGuildInfo = require('./utils/cacheGuildSettings')

require('dotenv').config()

if (process.env.SENTRY_URI) {
  raven.config(process.env.SENTRY_URI).install()
} else {
  global.logger.warn('No Sentry URI provided. Error logging will be restricted to messages only.')
}

async function init () {
  global.logger.info('Shard booting')
  global.redis = require('../db/clients/redis')
  global.bot = new Eris('MjgzNzQzNDYwNTQyOTA2MzY4.DsIDCQ.UadL838EKt2zrgeZFvl4aDam7YE', {
    firstShardID: cluster.worker.shardStart,
    lastShardID: cluster.worker.shardEnd,
    maxShards: cluster.worker.totalShards,
    disableEvents: { TYPING_START: true, PRESENCE_UPDATE: true },
    restMode: true,
    messageLimit: 0
  })

  global.bot.commands = {}
  global.bot.ignoredChannels = []
  global.bot.guildPrefixes = {}
  global.bot.guildSettingsCache = {}

  indexCommands() // yes, block the thread while we read commands.
  await cacheGuildInfo()
  let [on, once] = listenerIndexer()

  on.forEach((event) => bot.on(event.name, event.handle))
  once.forEach((event) => bot.once(event.name, event.handle))

  let [ignoredChannels, guildPrefixes] = await getCacheInfo()
  bot.ignoredChannels = ignoredChannels
  bot.guildPrefixes = guildPrefixes

  bot.connect()

  bot.on('error', console.error)
}

init()

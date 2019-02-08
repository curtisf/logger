const Eris = require('eris')
const cluster = require('cluster')
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
  global.bot = new Eris(process.env.BOT_TOKEN, {
    firstShardID: cluster.worker.shardStart,
    lastShardID: cluster.worker.shardEnd,
    maxShards: cluster.worker.totalShards,
    disableEvents: { TYPING_START: true },
    restMode: true,
    messageLimit: 0
  })

  global.bot.editStatus('dnd', {
    name: `Shard booting...`
  })

  global.bot.commands = {}
  global.bot.ignoredChannels = []
  global.bot.guildPrefixes = {}
  global.bot.guildSettingsCache = {}

  indexCommands() // yes, block the thread while we read commands.
  await cacheGuildInfo()
  const [on, once] = listenerIndexer()

  on.forEach(async event => global.bot.on(event.name, await event.handle))
  once.forEach(async event => global.bot.once(event.name, await event.handle))

  const [ignoredChannels, guildPrefixes] = await getCacheInfo()
  global.bot.ignoredChannels = ignoredChannels
  global.bot.guildPrefixes = guildPrefixes

  global.bot.connect()
}

init()

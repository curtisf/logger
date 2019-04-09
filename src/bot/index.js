const Eris = require('eris')
const cluster = require('cluster')
const raven = require('raven')
const Raven = require('raven')
const indexCommands = require('../miscellaneous/commandIndexer')
const listenerIndexer = require('../miscellaneous/listenerIndexer')
const getCacheInfo = require('./utils/getCacheInfo')
const cacheGuildInfo = require('./utils/cacheGuildSettings')
const deleteMessagesOlderThanDays = require('./modules/oldmessageremover').removeMessagesOlderThanDays

require('dotenv').config()
Raven.config(process.env.RAVEN_URI).install()

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
    messageLimit: 0,
    autoreconnect: true,
    getAllUsers: true
  })

  global.bot.editStatus('dnd', {
    name: `logger test bootup.`
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

  await global.bot.connect() // wait for everything to be cached

  require('../miscellaneous/bezerk')

  const oldMessagesDeleted = await deleteMessagesOlderThanDays(process.env.MESSAGE_HISTORY_DAYS)
  global.logger.info(`${oldMessagesDeleted} messages were deleted due to being older than ${process.env.MESSAGE_HISTORY_DAYS} day(s).`)
}

process.on('exit', (code) => {
  global.logger.error(`The process is exiting with code ${code}. Terminating pgsql connections...`)
  require('../db/clients/postgres').end()
})

process.on('unhandledRejection', (e) => {
  Raven.captureException(e, {level: 'error'})
})

process.on('uncaughtException', (e) => {
  Raven.captureException(e, {level: 'fatal'})
})

init()

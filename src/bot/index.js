const Eris = require('eris') // my local fork, will fix package.json later
const cluster = require('cluster')
const Raven = require('raven')
const redisLock = require('../db/interfaces/redis/redislock')
const indexCommands = require('../miscellaneous/commandIndexer')
const cacheGuildInfo = require('./utils/cacheGuildSettings')
const addBotListeners = require('./utils/addbotlisteners')

require('dotenv').config()

if (process.env.SENTRY_URI) {
  Raven.config(process.env.SENTRY_URI).install()
} else {
  global.logger.warn('No Sentry URI provided. Error logging will be restricted to messages only.')
}

function connect () {
  redisLock.lock('loggerinit', parseInt(process.env.REDIS_LOCK_TTL)).then(function (lock) {
    global.logger.startup(`Shards ${cluster.worker.rangeForShard} have obtained a lock and are connecting now. Configured Redis TTL is ${process.env.REDIS_LOCK_TTL}ms.`)
    global.bot.connect()
    global.bot.once('ready', () => {
      lock.unlock().catch(function () {
        global.logger.warn(cluster.worker.rangeForShard + ' could not unlock, waiting')
      })
    })
  }).catch(e => {
    setTimeout(() => {
      connect()
    }, 10000)
  }) // throw out not being able to obtain a lock.
}

async function init () {
  global.logger.info('Shard init')
  global.redis = require('../db/clients/redis')
  global.bot = new Eris(process.env.BOT_TOKEN, {
    firstShardID: cluster.worker.shardStart,
    lastShardID: cluster.worker.shardEnd,
    maxShards: cluster.worker.totalShards,
    allowedMentions: {
      everyone: false,
      roles: false,
      users: false
    },
    rest: {
      redisInstance: global.redis
    },
    restMode: true,
    messageLimit: 0,
    autoreconnect: true,
    intents: [
      'guilds',
      'guildVoiceStates',
      'guildEmojis',
      'guildInvites',
      'guildMembers',
      'guildMessages',
      'guildBans'
    ],
    defaultImageFormat: 'png',
    ...(process.env.USE_MAX_CONCURRENCY === 'true' ? { useMaxConcurrency: true } : {})
  })

  // Twilight stuff
  // const twilight = require('./modules/twilight')

  // twilight.initClient(global.bot)

  // global.bot.requestHandler = twilight

  global.bot.editStatus('dnd', {
    name: 'Bot is booting'
  })

  global.bot.commands = {}
  global.bot.ignoredChannels = []
  global.bot.guildSettingsCache = {}

  indexCommands() // yes, block the thread while we read commands.
  await cacheGuildInfo()

  addBotListeners()

  require('../miscellaneous/bezerk')

  connect()
}
process.on('exit', (code) => {
  global.logger.error(`The process is exiting with code ${code}. Terminating pgsql connections...`)
  require('../db/clients/postgres').end()
})

process.on('SIGINT', async () => {
  global.logger.error('SIGINT caught. Cleaning up and exiting...')
  require('../db/clients/postgres').end()
  process.exit()
})

process.on('unhandledRejection', (e) => {
  if (!e.message.includes('[50013]') && !e.message.includes('Request timed out') && !e.message.startsWith('500 INTERNAL SERVER ERROR') && !e.message.includes('global ratelimit')) {
    console.error(e)
    Raven.captureException(e.stack, { level: 'error' }) // handle when Discord freaks out
  }
})

process.on('uncaughtException', (e) => {
  if (!e.message.includes('[50013]') && !e.message.includes('Request timed out') && !e.message.startsWith('500 INTERNAL SERVER ERROR')) {
    console.error(e)
    Raven.captureException(e.stack, { level: 'fatal' })
  }
})

init()

const Eris = require('eris')
const cluster = require('cluster')
const Sentry = require('@sentry/node')
const redisLock = require('../db/interfaces/redis/redislock')
const indexCommands = require('../miscellaneous/commandIndexer')
const cacheGuildInfo = require('./utils/cacheGuildSettings')
const addBotListeners = require('./utils/addbotlisteners')

require('dotenv').config()

if (process.env.SENTRY_URI) {
  Sentry.init({
    dsn: process.env.SENTRY_URI,
    maxBreadcrumbs: 1
  })
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
      use_twilight: !!process.env.TWILIGHT_PORT || !!process.env.TWILIGHT_HOST,
      ...(!!process.env.TWILIGHT_PORT || !!process.env.TWILIGHT_HOST ? {
        domain: process.env.TWILIGHT_HOST || 'localhost',
        baseURL: '/api/v9',
        port: process.env.TWILIGHT_PORT || 8080,
        requestTimeout: 1000 * 60 * 30 // 1h time
      } : {})
    },
    restMode: true,
    messageLimit: 0,
    autoreconnect: 'auto',
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

  global.bot.editStatus('dnd', {
    name: 'Bot is booting'
  })

  global.bot.commands = {}
  global.bot.ignoredChannels = []
  global.bot.guildSettingsCache = {}

  if (!!process.env.TWILIGHT_PORT || !!process.env.TWILIGHT_HOST) {
    global.logger.info('Using HTTP proxy...')
  }

  indexCommands() // yes, block the thread while we read commands.
  await cacheGuildInfo()

  addBotListeners()

  if (process.env.BEZERK_URI && process.env.BEZERK_SECRET) {
    global.logger.info('Using bridge for website')
    require('../miscellaneous/bezerk')
  }

  connect()
}

process.on('exit', (code) => {
  global.logger.error(`The process is exiting with code ${code}. Terminating pgsql connections...`)
  const poolClient = require('../db/clients/postgres')
  poolClient.end(() => {
    global.logger.info('PostgreSQL clients returned')
  })
  if (process.env.TWILIGHT_PROXY_PORT) {
    global.bot.requestHandler.closeConn()
  }
})

process.on('SIGINT', async () => {
  global.logger.error('SIGINT caught. Cleaning up and exiting...')
  require('../db/clients/postgres').end()
  process.exit()
})

process.on('unhandledRejection', (e) => {
  if (!e.message.includes('[50013]') && !e.message.includes('Request timed out') && !e.message.startsWith('500 INTERNAL SERVER ERROR') && !e.message.includes('503 Service Temporarily Unavailable') && !e.message.includes('global ratelimit') && !e.message.includes('hang up')) {
    global.logger.error_nosentry(e)
    // sentry catches these already, stop double reporting
    // Sentry.captureException(e.stack, { level: 'error' }) // handle when Discord freaks out
  }
})

process.on('uncaughtException', (e) => {
  if (!e.message.includes('[50013]') && !e.message.includes('Request timed out') && !e.message.startsWith('500 INTERNAL SERVER ERROR') && !e.message.includes('503 Service Temporarily Unavailable') && !e.message.includes('global ratelimit') && !e.message.includes('hang up')) {
    global.logger.error_nosentry(e)
    Sentry.captureException(e.stack, { level: 'fatal' })
  }
})

init()

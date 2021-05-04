const Eris = require('eris')
const raven = require('raven')
const Raven = require('raven')
global.signale = require('signale')
const fs = require('fs')
const path = require('path')
const { CONFIG_TXT_EXAMPLE } = require('./utils/constants')
const dotenv = require('dotenv')
const requiredConfigElements = ['BOT_TOKEN', 'GLOBAL_BOT_PREFIX', 'CREATOR_IDS', 'I_HAVE_READ_THE_LICENSE']
precheckReqs().then(() => {
  init()
})
const indexCommands = require('../miscellaneous/commandIndexer')
const listenerIndexer = require('../miscellaneous/listenerIndexer')
const cacheGuildInfo = require('./utils/cacheGuildSettings')
const eventMiddleware = require('./modules/eventmiddleware')
const deleteMessagesOlderThanDays = require('./modules/oldmessageremover').removeMessagesOlderThanDays

function precheckReqs () {
  return new Promise((resolve, reject) => {
    global.signale.start('Starting bot...')
    if (process.execPath.includes('nodejs')) return // not packaged
    let rawConfig
    try {
      // rawConfig = fs.readFileSync(path.join(path.dirname(process.execPath), 'config.txt'))
      rawConfig = fs.readFileSync(path.resolve(__dirname, '../../config.txt'))
    } catch (e) {
      console.error('Could not find config, generating it for you. Fill it out!')
      global.signale.error('Could not find config.txt, one has been generated. Fill it out and restart the bot!')
      fs.closeSync(fs.openSync(path.join(path.dirname(process.execPath), 'config.txt'), 'w'))
      fs.writeFileSync(path.join(path.dirname(process.execPath), 'config.txt'), CONFIG_TXT_EXAMPLE)
      setTimeout(() => {
        process.exit(1)
      }, 120000)
      return
    }
    const parsedEnv = dotenv.parse(Buffer.from(rawConfig))
    global.envInfo = parsedEnv
    const missing = []
    requiredConfigElements.forEach(k => {
      if (!parsedEnv[k]) missing.push(k)
    })
    if (missing.length !== 0) {
      global.signale.error('Missing these config.txt values: ' + missing.join(', '))
      setTimeout(() => {
        process.exit(1)
      }, 120000)
    } else {
      global.signale.success('config.txt loaded successfully')
      resolve()
    }
  })
}

async function init () {
  global.bot = new Eris(global.envInfo.BOT_TOKEN, {
    disableEvents: { TYPING_START: true },
    restMode: true,
    messageLimit: 0,
    autoreconnect: true,
    getAllUsers: true,
    intents: 719
  })

  global.bot.editStatus('dnd', {
    name: 'Bot is booting'
  })

  global.bot.commands = {}
  global.bot.ignoredChannels = []
  global.bot.guildSettingsCache = {}

  indexCommands() // yes, block the thread while we read commands.
  await cacheGuildInfo()
  const [on, once] = listenerIndexer()

  // on.forEach(async event => global.bot.on(event.name, await event.handle))
  // once.forEach(async event => global.bot.once(event.name, await event.handle))

  on.forEach(async event => eventMiddleware(event, 'on'))
  once.forEach(async event => eventMiddleware(event, 'once'))

  global.signale.note('Connecting to Discord...')
  global.bot.connect()
  if (global.envInfo.ENABLE_API) {
    global.signale.success('Enabling API for dashboard use')
    require('../api/index')
  }
  await deleteMessagesOlderThanDays()

  // const oldMessagesDeleted = await deleteMessagesOlderThanDays(1l.envInfo.MESSAGE_HISTORY_DAYS) debating on removing these
  // global.logger.info(`${oldMessagesDeleted} messages were deleted due to being older than ${global.envInfo.MESSAGE_HISTORY_DAYS} day(s).`)
}
process.on('exit', (code) => {
  console.error(`The process is exiting with code ${code}. Terminating pgsql connections...`)
  // require('../db/clients/postgres').end()
})

process.on('SIGINT', async () => {
  console.error('SIGINT caught. Cleaning up and exiting...')
  // require('../db/clients/postgres').end()
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

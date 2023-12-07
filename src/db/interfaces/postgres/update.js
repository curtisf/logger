const pool = require('../../clients/postgres')
const escape = require('markdown-escape')
const getDoc = require('./read').getGuild
const getMessageById = require('./read').getMessageById
const cacheGuild = require('../../../bot/utils/cacheGuild')
const getMessageFromBatch = require('../../messageBatcher').getMessage
const updateBatchMessage = require('../../messageBatcher').updateMessage
const aes = require('../../aes')
const { postgresQueryExecution } = require('../../../miscellaneous/prometheus')

const eventList = [
  'channelCreate',
  'channelUpdate',
  'channelDelete',
  'guildBanAdd',
  'guildBanRemove',
  'guildRoleCreate',
  'guildRoleDelete',
  'guildRoleUpdate',
  'guildUpdate',
  'messageDelete',
  'messageDeleteBulk',
  'messageUpdate',
  'guildMemberAdd',
  'guildMemberKick',
  'guildMemberRemove',
  'guildMemberUpdate',
  'voiceChannelLeave',
  'voiceChannelJoin',
  'voiceStateUpdate',
  'voiceChannelSwitch',
  'guildEmojisUpdate',
  'guildMemberNickUpdate'
]

const eventLogs = {
  channelCreate: '',
  channelUpdate: '',
  channelDelete: '',
  guildBanAdd: '',
  guildBanRemove: '',
  guildRoleCreate: '',
  guildRoleDelete: '',
  guildRoleUpdate: '',
  guildUpdate: '',
  messageDelete: '',
  messageDeleteBulk: '',
  messageUpdate: '',
  guildMemberAdd: '',
  guildMemberKick: '',
  guildMemberRemove: '',
  guildMemberUpdate: '',
  voiceChannelLeave: '',
  voiceChannelJoin: '',
  voiceStateUpdate: '',
  voiceChannelSwitch: '',
  guildEmojisUpdate: '',
  guildMemberNickUpdate: '',
  guildMemberBoostUpdate: '',
  guildMemberVerify: '' // I am a moron for having an object representing
} // default event settings in multiple places instead of in constants.js

async function clearEventLog (guildID) {
  await cacheGuild(guildID)
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('UPDATE guilds SET event_logs=$1 WHERE id=$2', [eventLogs, guildID])
  queryStartTimer({ context: 'clearEventLog' })
}

async function clearEventByID (guildID, channelID) {
  const doc = await getDoc(guildID)
  const eventLogs = doc.event_logs
  Object.keys(eventLogs).forEach(event => {
    if (eventLogs[event] === channelID) {
      eventLogs[event] = ''
    }
  })
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('UPDATE guilds SET event_logs=$1 WHERE id=$2', [eventLogs, guildID])
  queryStartTimer({ context: 'clearEventByID' })
  await cacheGuild(guildID)
}

async function setAllEventsOneId (guildID, channelID) {
  const doc = await getDoc(guildID)
  const eventLogs = doc.event_logs
  Object.keys(eventLogs).forEach(event => {
    eventLogs[event] = channelID
  })
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('UPDATE guilds SET event_logs=$1 WHERE id=$2', [eventLogs, guildID])
  queryStartTimer({ context: 'setAllEventsOneId' })
  await cacheGuild(guildID)
}

async function setEventsLogId (guildID, channelID, events) {
  const doc = await getDoc(guildID)
  events.forEach(event => {
    doc.event_logs[event] = channelID
  })
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('UPDATE guilds SET event_logs=$1 WHERE id=$2', [doc.event_logs, guildID])
  queryStartTimer({ context: 'setEventsLogId' })
  await cacheGuild(guildID)
}

// async function setEventsRawLogs (guildID, channelID, events) {
//   const doc = await getDoc(guildID)
//   doc.event_logs = { ...doc.event_logs, ...events }
//   await pool.query('UPDATE guilds SET event_logs=$1 WHERE id=$2', [doc.event_logs, guildID])
//   await cacheGuild(guildID)
// }

async function disableEvent (guildID, event) {
  const doc = await getDoc(guildID)
  let disabled = true
  if (doc.disabled_events.includes(event)) {
    doc.disabled_events.splice(doc.disabled_events.indexOf(event), 1)
    disabled = false
  } else {
    doc.disabled_events.push(event)
  }
  global.bot.guildSettingsCache[guildID].disabledEvents = doc.disabled_events
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('UPDATE guilds SET disabled_events=$1 WHERE id=$2', [doc.disabled_events, guildID])
  queryStartTimer({ context: 'disableEvent' })
  await cacheGuild(guildID)
  return disabled
}

async function ignoreChannel (guildID, channelID) {
  const doc = await getDoc(guildID)
  let disabled = true
  if (doc.ignored_channels.includes(channelID)) {
    const index = doc.ignored_channels.indexOf(channelID)
    doc.ignored_channels.splice(index, 1)
    disabled = false
  } else {
    doc.ignored_channels.push(channelID)
  }
  global.bot.guildSettingsCache[guildID].ignoredChannels = doc.ignored_channels
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('UPDATE guilds SET ignored_channels=$1 WHERE id=$2', [doc.ignored_channels, guildID])
  queryStartTimer({ context: 'ignoreChannel' })
  return disabled
}

async function clearIgnoredChannels (guildID) {
  global.bot.guildSettingsCache[guildID].ignoredChannels = []
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('UPDATE guilds SET ignored_channels=$1 WHERE id=$2', [[], guildID])
  queryStartTimer({ context: 'clearIgnoredChannels' })
}

async function toggleLogBots (guildID) {
  const doc = await getDoc(guildID)
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('UPDATE guilds SET log_bots=$1 WHERE id=$2', [!doc.log_bots, guildID])
  queryStartTimer({ context: 'toggleLogBots' })
  global.bot.guildSettingsCache[guildID].logBots = !doc.log_bots
  return !doc.log_bots
}

async function updateMessageByID (id, content) {
  const batchMessage = await getMessageFromBatch(id)
  if (!batchMessage) {
    const queryStartTimer = postgresQueryExecution.startTimer()
    await pool.query('UPDATE messages SET content=$1 WHERE id=$2', [(await aes.encrypt([content || 'EMPTY STRING']))?.[0], id])
    queryStartTimer({ context: 'updateMessageByID' })
  } else {
    updateBatchMessage(id, content)
  }
}

exports.toggleLogBots = toggleLogBots
exports.disableEvent = disableEvent
exports.ignoreChannel = ignoreChannel
exports.clearEventLog = clearEventLog
exports.clearEventByID = clearEventByID
exports.setAllEventsOneId = setAllEventsOneId
exports.setEventsLogId = setEventsLogId
exports.clearIgnoredChannels = clearIgnoredChannels
// exports.setEventsRawLogs = setEventsRawLogs
exports.updateMessageByID = updateMessageByID

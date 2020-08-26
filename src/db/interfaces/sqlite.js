const sqlite = require('../clients/sqlite')

function runQuery (sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) throw err
      resolve({ rows })
    })
  })
}

const getDoc = getGuild
const cacheGuild = require('../../bot/utils/cacheGuild')
const getMessageFromBatch = require('../messageBatcher').getMessage
const updateBatchMessage = require('../messageBatcher').updateMessage
const aes = require('../aes')
const batchHandler = require('../messageBatcher')
const db = require('../clients/sqlite')
let arr = []
arr[0] = 'placeholder'
arr = JSON.stringify(arr)
const placeholder = aes.encrypt(arr)

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
  'messageReactionRemoveAll',
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
  messageReactionRemoveAll: '',
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
  guildMemberNickUpdate: ''
}

async function clearEventLog (guildID) {
  await cacheGuild(guildID)
  return await runQuery('UPDATE guilds SET event_logs=$1 WHERE id=$2', [JSON.stringify(eventLogs), guildID])
}

async function clearEventByID (guildID, channelID) {
  const doc = await getDoc(guildID)
  const eventLogs = doc.event_logs
  Object.keys(eventLogs).forEach(event => {
    if (eventLogs[event] === channelID) {
      eventLogs[event] = ''
    }
  })
  await runQuery('UPDATE guilds SET event_logs=$1 WHERE id=$2', [JSON.stringify(eventLogs), guildID])
  await cacheGuild(guildID)
}

async function setAllEventsOneId (guildID, channelID) {
  const doc = await getDoc(guildID)
  eventList.forEach(event => {
    doc.event_logs[event] = channelID
  })
  await cacheGuild(guildID)
  return await runQuery('UPDATE guilds SET event_logs=$1 WHERE id=$2', [JSON.stringify(doc.event_logs), guildID])
}

async function setEventsLogId (guildID, channelID, events) {
  const doc = await getDoc(guildID)
  events.forEach(event => {
    doc.event_logs[event] = channelID
  })
  await cacheGuild(guildID)
  return await runQuery('UPDATE guilds SET event_logs=$1 WHERE id=$2', [JSON.stringify(doc.event_logs), guildID])
}

async function setEventLogsWhole (guildID, eventLogs) {
  const doc = await getDoc(guildID)
  doc.event_logs = eventLogs
  await runQuery('UPDATE guilds SET event_logs=$1 WHERE id=$2', [JSON.stringify(doc.event_logs), guildID])
  await cacheGuild(guildID)
}

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
  await runQuery('UPDATE guilds SET disabled_events=$1 WHERE id=$2', [doc.disabled_events, guildID])
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
  await runQuery('UPDATE guilds SET ignored_channels=$1 WHERE id=$2', [JSON.stringify(doc.ignored_channels), guildID])
  return disabled
}

async function toggleLogBots (guildID) {
  const doc = await getDoc(guildID)
  await runQuery('UPDATE guilds SET log_bots=$1 WHERE id=$2', [!doc.log_bots, guildID])
  global.bot.guildSettingsCache[guildID].logBots = !doc.log_bots
  return !doc.log_bots
}

async function updateMessageByID (id, content) {
  const batchMessage = await getMessageFromBatch(id)
  if (!batchMessage) {
    return await runQuery('UPDATE messages SET content=$1 WHERE id=$2', [aes.encrypt(content || 'EMPTY STRING'), id])
  } else {
    updateBatchMessage(id, content)
  }
}

exports.setEventLogsWhole = setEventLogsWhole
exports.toggleLogBots = toggleLogBots
exports.disableEvent = disableEvent
exports.ignoreChannel = ignoreChannel
exports.clearEventLog = clearEventLog
exports.clearEventByID = clearEventByID
exports.setAllEventsOneId = setAllEventsOneId
exports.setEventsLogId = setEventsLogId
exports.updateMessageByID = updateMessageByID

async function getGuild (guildID) {
  const doc = await runQuery('SELECT * FROM guilds WHERE id=$1;', [guildID])
  if (doc.rows.length === 0) {
    if (global.bot.guilds.get(guildID)) {
      await createGuild(global.bot.guilds.get(guildID))
      return await getGuild(guildID)
    }
  }
  doc.rows[0].event_logs = JSON.parse(doc.rows[0].event_logs)
  doc.rows[0].ignored_channels = doc.rows[0].ignored_channels ? JSON.parse(doc.rows[0].ignored_channels) : []
  return doc.rows[0]
}

async function getMessagesByAuthor (userID) {
  const resp = await runQuery('SELECT * FROM messages WHERE author_id=$1', [userID])
  const promiseArray = resp.rows.map(m => {
    const decryptedMessage = decryptMessageDoc(m)
    return decryptedMessage
  })
  const done = await Promise.all(promiseArray)
  return done
}

async function getMessageById (messageID) {
  let message = await runQuery('SELECT * FROM messages WHERE id=$1', [messageID])
  if (message.rows.length === 0) return null
  message = await decryptMessageDoc(message.rows[0])
  return message
}

async function decryptUserDoc (userDoc) {
  userDoc.names = JSON.parse(aes.decrypt(userDoc.names))
  return userDoc
}

async function decryptMessageDoc (message) {
  message.content = aes.decrypt(message.content)
  if (message.attachment_b64) message.attachment_b64 = aes.decrypt(message.attachment_b64)
  return message
}

exports.getMessageById = getMessageById
exports.getMessagesByAuthor = getMessagesByAuthor
exports.getGuild = getGuild

async function cacheMessage (message) {
  message.content = aes.encrypt(message.content ? message.content : 'None')
  message.attachment_b64 = ''
  batchHandler.addItem([message.id, message.author.id, message.content, message.attachment_b64, new Date().toISOString()])
}

async function createGuild (guild) {
  try {
    await runQuery('INSERT INTO guilds (id, owner_id, ignored_channels, disabled_events, event_logs, log_bots) VALUES ($1, $2, $3, $4, $5, $6)', [guild.id, guild.ownerID, '[]', [], JSON.stringify(eventLogs), false]) // Regenerate the document if a user kicks and reinvites the bot.
    await cacheGuild(guild.id)
  } catch (e) {}
}

async function getAllGuilds () {
  const doc = await runQuery('SELECT * FROM guilds;')
  return doc.rows.map(g => {
    g.event_logs = JSON.parse(g.event_logs)
    return g
  })
}

async function deleteMessage (messageID) {
  await runQuery('DELETE FROM messages WHERE id=$1', [messageID])
}

exports.deleteMessage = deleteMessage
exports.getAllGuilds = getAllGuilds
exports.cacheMessage = cacheMessage
exports.createGuild = createGuild
exports.runQuery = runQuery

const pool = require('../../clients/postgres')
const aes = require('../../aes')
const cacheGuild = require('../../../bot/utils/cacheGuild')
const batchHandler = require('../../messageBatcher')
let arr = []
arr[0] = 'placeholder'
arr = JSON.stringify(arr)
const placeholder = aes.encrypt(arr)

const eventLogs = {
  'channelCreate': '',
  'channelUpdate': '',
  'channelDelete': '',
  'guildBanAdd': '',
  'guildBanRemove': '',
  'guildRoleCreate': '',
  'guildRoleDelete': '',
  'guildRoleUpdate': '',
  'guildUpdate': '',
  'messageDelete': '',
  'messageDeleteBulk': '',
  'messageReactionRemoveAll': '',
  'messageUpdate': '',
  'guildMemberAdd': '',
  'guildMemberKick': '',
  'guildMemberRemove': '',
  'guildMemberUpdate': '',
  'voiceChannelLeave': '',
  'voiceChannelJoin': '',
  'voiceStateUpdate': '',
  'voiceChannelSwitch': '',
  'guildEmojisUpdate': '',
  'guildMemberNickUpdate': ''
}

async function createGuild (guild) {
  try {
    await pool.query('INSERT INTO guilds (id, owner_id, ignored_channels, disabled_events, event_logs, log_bots) VALUES ($1, $2, $3, $4, $5, $6)', [guild.id, guild.ownerID, [], [], eventLogs, false]) // Regenerate the document if a user kicks and reinvites the bot.
    await cacheGuild(guild.id)
  } catch (e) {}
}

async function createUserDocument (userID) {
  try {
    await pool.query('INSERT INTO users (id, names) VALUES ($1, $2)', [userID, placeholder])
  } catch (e) {}
}

async function cacheMessage (message) {
  message.content = aes.encrypt(message.content ? message.content : 'None')
  message.attachment_b64 = ''
  batchHandler.addItem([message.id, message.author.id, message.content, message.attachment_b64, new Date().toISOString()])
}

exports.cacheMessage = cacheMessage
exports.createUserDocument = createUserDocument
exports.createGuild = createGuild

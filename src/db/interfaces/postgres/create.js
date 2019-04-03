const pool = require('../../clients/postgres')
const aes = require('../../aes')
const cacheGuild = require('../../../bot/utils/cacheGuild')
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
  console.log(`Creating a guild document for guild ${guild.name} with ${guild.memberCount} members.`)
  try {
    await pool.query('INSERT INTO guilds (id, owner_id, ignored_channels, disabled_events, event_logs, log_bots) VALUES ($1, $2, $3, $4, $5, $6)', [guild.id, guild.ownerID, [], [], eventLogs, false]) // Regenerate the document if a user kicks and reinvites the bot.
    await cacheGuild(guild.id)
  } catch (e) {}
}

async function createUserDocument (userID) {
  console.log(`Creating a user document for ${userID}`)
  try {
    await pool.query('INSERT INTO users (id, names) VALUES ($1, $2)', [userID, placeholder])
  } catch (e) {}
}

async function cacheMessage (message) {
  message.content = aes.encrypt(message.content ? message.content : 'None')
  if (message.attachment_b64) {
    message.attachment_b64 = aes.encrypt(message.attachment_b64)
  } else message.attachment_b64 = ''
  return await pool.query('INSERT INTO messages (id, author_id, content, attachment_b64, ts) VALUES ($1, $2, $3, $4, NOW())', [message.id, message.author.id, message.content, message.attachment_b64])
}

exports.cacheMessage = cacheMessage
exports.createUserDocument = createUserDocument
exports.createGuild = createGuild

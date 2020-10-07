const pool = require('../../clients/postgres')
const aes = require('../../aes')
const cacheGuild = require('../../../bot/utils/cacheGuild')
const batchHandler = require('../../messageBatcher')
const escape = require('markdown-escape')

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

async function createGuild (guild) {
  try {
    await pool.query('INSERT INTO guilds (id, owner_id, ignored_channels, disabled_events, event_logs, log_bots) VALUES ($1, $2, $3, $4, $5, $6)', [guild.id, guild.ownerID, [], [], eventLogs, false]) // Regenerate the document if a user kicks and reinvites the bot.
    await cacheGuild(guild.id)
  } catch (e) { }
}

async function cacheMessage (message) {
  if (!message.content) {
    message.content = aes.encrypt('None')
  } else {
    message.content = aes.encrypt(escape(message.content.replace(/~/g, '\\~'), ['angle brackets']))
  }
  message.attachment_b64 = ''
  batchHandler.addItem([message.id, message.author.id, message.content, message.attachment_b64, new Date().toISOString()])
}

exports.cacheMessage = cacheMessage
exports.createGuild = createGuild

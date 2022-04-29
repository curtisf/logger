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
  messageUpdate: '',
  guildMemberAdd: '',
  guildMemberKick: '',
  guildMemberRemove: '',
  guildMemberUpdate: '',
  guildMemberVerify: '',
  voiceChannelLeave: '',
  voiceChannelJoin: '',
  voiceStateUpdate: '',
  voiceChannelSwitch: '',
  guildEmojisUpdate: '',
  guildStickersUpdate: '',
  guildMemberNickUpdate: '',
  guildMemberBoostUpdate: ''
}

async function createGuild (guild) {
  try {
    await pool.query('INSERT INTO guilds (id, owner_id, ignored_channels, disabled_events, event_logs, log_bots, custom_settings) VALUES ($1, $2, $3, $4, $5, $6, $7)', [guild.id, guild.ownerID, [], [], eventLogs, false, { }]) // Regenerate the document if a user kicks and reinvites the bot.
    await cacheGuild(guild.id)
  } catch (e) { }
}

async function cacheMessage (message) {
  let content = '';
  if (!message.content) {
    content = 'None';
  } else {
    content = escape(message.content.replace(/~/g, '\\~'), ['angle brackets'])
  }

  if(message.stickerItems) {
    content += '\n' + message.stickerItems.map(s => `Sticker: [ ${s.name} ] - https://media.discordapp.net/stickers/${s.id}.png?size=320`).join('\n')
  }

  message.content = aes.encrypt(content)
  message.attachment_b64 = message?.attachments.length ? aes.encrypt(message?.attachments.map(atc => atc.proxy_url).join('\n')) : ''
  batchHandler.addItem([message.id, message.author.id, message.content, message.attachment_b64, new Date().toISOString()])
}

exports.cacheMessage = cacheMessage
exports.createGuild = createGuild

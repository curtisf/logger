const pool = require('../../clients/postgres')

exports.deleteGuild = async function (guildID) {
  return await pool.query('DELETE FROM guilds WHERE id=$1', [guildID])
}

exports.deleteMessage = async function (messageID) {
  return await pool.query('DELETE FROM messages WHERE id=$1', [messageID])
}

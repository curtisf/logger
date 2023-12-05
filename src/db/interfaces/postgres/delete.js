const { postgresQueryExecution } = require('../../../bot/modules/prometheus')
const pool = require('../../clients/postgres')

exports.deleteGuild = async function (guildID) {
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('DELETE FROM guilds WHERE id=$1', [guildID])
  queryStartTimer({ context: 'deleteGuild' })
}

exports.deleteMessage = async function (messageID) {
  const queryStartTimer = postgresQueryExecution.startTimer()
  await pool.query('DELETE FROM messages WHERE id=$1', [messageID])
  queryStartTimer({ context: 'deleteMessage' })
}

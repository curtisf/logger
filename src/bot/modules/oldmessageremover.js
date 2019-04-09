const pool = require('../../db/clients/postgres')

module.exports = {
  removeMessagesOlderThanDays: async (days) => {
    const result = await pool.query(`DELETE FROM messages WHERE ts < now() - interval '${days} days'`)
    return result.rowCount
  }
}

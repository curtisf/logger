const { runQuery } = require('../../db/interfaces/sqlite')

module.exports = {
  removeMessagesOlderThanDays: async () => {
    const result = await runQuery("DELETE FROM messages WHERE ts <= date('now', '-7 day')")
    return result.rows.length
  }
}

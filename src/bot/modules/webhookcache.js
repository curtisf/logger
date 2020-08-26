const runQuery = require('../../db/interfaces/sqlite').runQuery

module.exports = {
  setWebhook: (channelID, webhookID, webhookToken) => {
    runQuery('INSERT INTO webhooks ( channel_id, webhook_id, webhook_token) VALUES ($1, $2, $3)', [channelID, webhookID, webhookToken])
  },
  getWebhook: async channelID => {
    const webhookDoc = await runQuery('SELECT * FROM webhooks WHERE channel_id=$1', [channelID])
    if (webhookDoc.rows.length === 0) return null
    return `${webhookDoc.rows[0].webhook_id}|${webhookDoc.rows[0].webhook_token}`
  },
  deleteWebhook: channelID => {
    runQuery('DELETE FROM webhooks WHERE channel_id=$1', [channelID])
  }
}

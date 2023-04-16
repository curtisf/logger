const cluster = require('cluster')

module.exports = {
    name: 'shardReady',
    type: 'on',
    handle: async (shardID) => {
      global.logger.info(`[${cluster.worker.rangeForShard}] Shard ${shardID} is fully ready`)
      global.webhook.warn(`[${cluster.worker.rangeForShard}] Shard ${shardID} is fully ready`)
    }
  }
const cluster = require('cluster')

module.exports = {
    name: 'shardResume',
    type: 'on',
    handle: async (shardID) => {
      const cachedShard = global.bot.shards.get(shardID)
      global.logger.info(`[${cluster.worker.rangeForShard}] Shard ${shardID} has resumed`, err)
      global.webhook.warn(`[${cluster.worker.rangeForShard}] Shard ${shardID} is fully ready\n\nResume -> ${cachedShard.resumeURL}\nStatus -> ${cachedShard.status}\nReconnecting? -> ${cachedShard.connecting ? 'yes' : 'no'}\nLast heartbeat sent: <t:${Math.ceil(cachedShard.lastHeartbeatSent / 1000)}>\nLast heartbeat received: <t:${Math.ceil(cachedShard.lastHeartbeatReceived / 1000)}>`)
    }
  }
const cluster = require('cluster')
const checkForMissingSettings = require('../utils/recoverSettings')
const statAggregator = require('../modules/statAggregator')

module.exports = {
  name: 'ready',
  type: 'once',
  handle: async () => {
    statAggregator.incrementMisc('ready')
    global.logger.info(`Worker instance hosting ${cluster.worker.rangeForShard} on id ${cluster.worker.id} is now ready to serve requests. This shard or shard range has ${global.bot.guilds.size} guilds and ${global.bot.users.size} users cached.`)
    global.webhook.generic(`Worker instance hosting ${cluster.worker.rangeForShard} on id ${cluster.worker.id} is now ready to serve requests. This shard or shard range has ${global.bot.guilds.size} guilds and ${global.bot.users.size} users cached.`)
    global.bot.editStatus('online', {
      name: `Use %help | ${cluster.worker.rangeForShard} | Watching ${global.bot.guilds.size} guilds`
    })
    if (global.bot.shards.find(s => s.id === 0)) { // only check for missing settings once
      await checkForMissingSettings()
    }
  }
}

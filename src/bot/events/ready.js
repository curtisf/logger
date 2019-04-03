const cluster = require('cluster')
const checkForMissingSettings = require('../utils/recoverSettings')

module.exports = {
  name: 'ready',
  type: 'once',
  handle: async () => {
    // TODO: Add a cache handler to fetch all users to ignore.
    global.logger.info(`Worker instance hosting ${cluster.worker.rangeForShard} on id ${cluster.worker.id} is now ready to serve requests. This shard or shard range has ${global.bot.guilds.size} guilds and ${global.bot.users.size} users cached.`)
    global.webhook.generic(`Worker instance hosting ${cluster.worker.rangeForShard} on id ${cluster.worker.id} is now ready to serve requests. This shard or shard range has ${global.bot.guilds.size} guilds and ${global.bot.users.size} users cached.`)
    global.bot.editStatus('online', {
      name: `V3! Use %help | ${cluster.worker.rangeForShard} | ${global.bot.guilds.size}`
    })
    if (global.bot.shards.find(s => s.id === 0)) {
      await checkForMissingSettings()
    }
  }
}

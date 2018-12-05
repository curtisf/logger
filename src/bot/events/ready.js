module.exports = {
  name: 'ready',
  type: 'once',
  handle: () => {
    global.logger.info(`Worker instance hosting ${cluster.worker.rangeForShard} on id ${cluster.worker.id} is now ready to serve requests. This shard or shard range has ${global.bot.guilds.size} guilds and ${global.bot.users.size} users cached.`)
    global.webhook.generic(`Worker instance hosting ${cluster.worker.rangeForShard} on id ${cluster.worker.id} is now ready to serve requests. This shard or shard range has ${global.bot.guilds.size} guilds and ${global.bot.users.size} users cached.`)
  }
}

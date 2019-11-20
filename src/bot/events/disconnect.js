const statAggregator = require('../modules/statAggregator')
let reconnects = 0

module.exports = {
  name: 'disconnect',
  type: 'on',
  handle: () => {
    statAggregator.incrementMisc('disconnect')
    reconnects++
    global.logger.error(`Worker instance hosting ${cluster.worker.rangeForShard} on id ${cluster.worker.id} disconnected from the gateway. ${reconnects} out of 10.`)
    if (reconnects >= 10) {
      global.bot.disconnect(true) // Disconnect the bot but don't destroy member caches
    }
  }
}

setInterval(() => {
  reconnects = 0 // Reset reconnect loop counter
}, 120000)

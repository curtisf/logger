const statAggregator = require('../modules/statAggregator')
let reconnects = 0

module.exports = {
  name: 'disconnect',
  type: 'on',
  handle: () => {
    global.signale.pause('Disconnected from Discord, trying to reconnect')
    reconnects++
    if (reconnects >= 10) {
      global.bot.disconnect(true) // Disconnect the bot but don't destroy member caches
    }
  }
}

setInterval(() => {
  reconnects = 0 // Reset reconnect loop counter
}, 120000)

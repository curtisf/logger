const cluster = require('cluster')

module.exports = {
  name: 'debug',
  type: 'once',
  handle: async (message) => {
    global.logger.debug(`${cluster.worker.rangeForShard} [DEBUG]: ${message}`)
  }
}

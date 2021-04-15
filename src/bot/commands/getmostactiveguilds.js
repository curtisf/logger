const syncRequestHandler = require('../modules/syncedrequestworker')

module.exports = {
  func: async (message, suffix) => {
    if (suffix === 'clear') {
      process.send({
        type: 'debugActivity',
        data: 'clear'
      })
    } else if (suffix === 'cpu') {
      process.send({
        type: 'debugActivity',
        data: 'cpuusage'
      })
    } else if (suffix === 'cluster') {
      syncRequestHandler.printActivityMap()
    } else if (suffix === 'clear cluster') {
      syncRequestHandler.clearActivityMap()
    } else if (suffix === 'cpu cluster') {
      const os = require('os-utils')

      os.cpuUsage(v => {
        console.log(`[${cluster.worker.rangeForShard}] CPU usage: ${v * 100}%`)
      })
      os.cpuFree(v => {
        console.log(`[${cluster.worker.rangeForShard}] CPU free: ${v * 100}%`)
      })
    } else {
      process.send({
        type: 'debugActivity',
        data: 'show'
      })
    }
  },
  name: 'getmostactiveguilds',
  description: 'Bot owner debug command.',
  type: 'creator',
  hidden: true
}

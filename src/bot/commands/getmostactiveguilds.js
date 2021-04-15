const syncRequestHandler = require('../modules/syncedrequestworker')

module.exports = {
  func: async (message, suffix) => {
    if (suffix === 'clear') {
      process.send({
        type: 'debugActivity',
        data: 'clear'
      })
    } else if (suffix === 'cluster') {
      syncRequestHandler.printActivityMap()
    } else if (suffix === 'clear cluster') {
      syncRequestHandler.clearActivityMap()
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

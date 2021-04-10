const commandIndexer = require('../../miscellaneous/commandIndexer')

module.exports = {
  func: async function (message, suffix) {
    try {
      global.bot.commands = {}
      commandIndexer()
      await message.channel.createMessage('🆗 reloaded commands')
    } catch (e) {
      console.error(e)
      await message.channel.createMessage('There was an issue reloading commands. The error has been logged, and this cluster is restarting for safety.')
      global.logger.fatal('There was an issue reloading commands. The error has been logged, and this cluster is restarting for safety.')
    }
  },
  name: 'reindexcommands',
  description: 'Bot owner debug command.',
  type: 'creator',
  hidden: true
}

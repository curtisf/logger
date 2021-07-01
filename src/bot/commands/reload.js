const commandIndexer = require('../../miscellaneous/commandIndexer')
const addBotListeners = require('../utils/addbotlisteners')

module.exports = {
  func: async function (message, suffix) {
    if (!suffix) return message.channel.createMessage({ content: 'Provide `commands` or `events`', messageReference: { messageID: message.id } })
    if (suffix === 'commands') {
      try {
        global.bot.commands = {}
        commandIndexer()
        await message.channel.createMessage(`Successfully reloaded ${Object.keys(global.bot.commands).length} commands.`)
      } catch (e) {
        console.error(e)
        await message.channel.createMessage('There was an issue reloading commands. The error has been logged, and this cluster is restarting for safety.')
        global.logger.fatal('There was an issue reloading commands. The error has been logged, and this cluster is restarting for safety.')
      }
    } else if (suffix === 'events') {
      try {
        global.bot.removeAllListeners()
        addBotListeners()
        await message.channel.createMessage({ content: 'Successfully reloaded events', messageReference: { messageID: message.id } })
      } catch (e) {
        console.error(e)
        await message.channel.createMessage('There was an issue reloading events. The error has been logged, and this cluster is restarting for safety.')
        global.logger.fatal('There was an issue reloading events. The error has been logged, and this cluster is restarting for safety.')
      }
    }
  },
  name: 'reload',
  description: 'Bot owner debug command.',
  type: 'creator',
  hidden: true
}

const commandHandler = require('../modules/commandhandler')
const cacheMessage = require('../../db/interfaces/postgres/create').cacheMessage

module.exports = {
  name: 'messageCreate',
  type: 'on',
  handle: async message => {
    if (message.author.bot || !message.member) return
    await commandHandler(message)
    if (message.author.id === global.bot.user.id) return // dump logs made by the bot
    await cacheMessage(message)
  }
}

const commandHandler = require('../modules/commandhandler')
const cacheMessage = require('../../db/interfaces/postgres/create').cacheMessage

module.exports = {
  name: 'messageCreate',
  type: 'on',
  handle: async message => {
    if (message.author.bot || !message.member) return
    await commandHandler(message)
    await cacheMessage(message)
  }
}

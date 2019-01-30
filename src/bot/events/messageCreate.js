const commandHandler = require('../modules/commandhandler')

module.exports = {
  name: 'messageCreate',
  type: 'on',
  handle: async message => {
    global.redis.set(message.id, JSON.stringify({
      userID: message.author.id,
      content: message.content.substring(0, 1020),
      timestamp: message.timestamp,
      attachment: message.attachments.length !== 0
    }), 'EX', 10800000) // 3 hours.
    if (message.author.bot || !message.member) return
    await commandHandler(message)
  }
}

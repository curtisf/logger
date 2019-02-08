const getMessagesByAuthor = require('../../db/interfaces/postgres/read').getMessagesByAuthor
const getMessageById = require('../../db/interfaces/postgres/read').getMessageById

module.exports = {
  func: async (message, suffix) => {
      const split = suffix.split(' ')
      if (split[0] === 'author') {
          const m = await getMessagesByAuthor(split[1])
          await message.channel.createMessage(JSON.stringify(m).substr(0, 1250))
      } else if (split[0] === 'message') {
          const m = await getMessageById(split[1])
          await message.channel.createMessage(JSON.stringify(m))
      } else {
          await message.channel.createMessage('no')
      }
  },
  name: 'lookup',
  description: 'Bot owner debug command.',
  type: 'creator'
}

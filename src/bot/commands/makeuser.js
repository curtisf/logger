const createDoc = require('../../db/interfaces/postgres/create').createUserDocument

module.exports = {
  func: async (message, suffix) => {
    await createDoc(message.author.id)
    message.channel.createMessage(':ok:')
  },
  name: 'makeuser',
  description: 'Bot owner debug command.',
  type: 'creator'
}

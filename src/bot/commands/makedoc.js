const createDoc = require('../../db/interfaces/postgres/create').createGuild
module.exports = {
  func: async (message, suffix) => {
    await createDoc(message.channel.guild)
    message.channel.createMessage(':ok:')
  },
  name: 'makedoc',
  description: 'Bot owner debug command.',
  type: 'creator'
}

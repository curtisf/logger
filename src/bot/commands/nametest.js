const updateNames = require('../../db/interfaces/postgres/update').updateNames
const getUserDoc = require('../../db/interfaces/postgres/read').getUser

module.exports = {
  func: async (message, suffix) => {
    if (suffix) { // Test command for adding names to a user and viewing them
        await updateNames(message.author.id, suffix)
        message.channel.createMessage(`:ok: added \`${suffix}\``)
    } else {
        let names = await getUserDoc(message.author.id)
        message.channel.createMessage(JSON.stringify(names))
    }
  },
  name: 'nametest',
  description: 'Bot owner debug command.',
  type: 'creator'
}

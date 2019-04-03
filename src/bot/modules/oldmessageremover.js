const getAllMessages = require('../../db/interfaces/postgres/read').getAllMessages
const deleteMessage = require('../../db/interfaces/postgres/delete').deleteMessage

module.exports = {
    removeMessagesOlderThanDays: async (days) => {
        const messages = await getAllMessages() // no need to decrypt the contents.
        const toRemove = []
        const currentTime = new Date().getTime()
        messages.forEach(message => {
            if (currentTime - new Date(message.ts).getTime() > (86400000 * days)) {
                toRemove.push(message)
            }
        })
        toRemove.forEach(async message => {
            await deleteMessage(message.id)
        })
        return toRemove.length
    }
}
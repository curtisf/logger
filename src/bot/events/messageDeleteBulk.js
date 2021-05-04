const sa = require('superagent')
const getMessageById = require('../../db/interfaces/sqlite').getMessageById
const send = require('../modules/webhooksender')

module.exports = {
  name: 'messageDeleteBulk',
  type: 'on',
  handle: async messages => {
    const dbMessages = []
    await messages.forEach(async (m, i) => {
      const message = await getMessageById(m.id)
      if (message) dbMessages.push(message)
      if (i === messages.length - 1) await paste(dbMessages, messages[0].channel.guild.id)
    })
  }
}

async function paste (messages, guildID) {
  if (!messages) return
  const messageDeleteBulkEvent = {
    guildID: guildID,
    eventName: 'messageDeleteBulk',
    embed: {
      description: `**${messages.length}** message(s) were deleted and known in cache.`,
      fields: [],
      color: 15550861
    }
  }
  const pasteString = messages.reverse().map(m => {
    let globalUser = global.bot.users.get(m.author_id)
    if (!globalUser) {
      globalUser = {
        username: 'Unknown',
        discriminator: '0000',
        avatarURL: '<no avatar>'
      }
    }
    return `${globalUser.username}#${globalUser.discriminator} (${m.author_id}) | ${new Date(m.ts).toString()}: ${m.content}`
  }).join('\r\n')
  const uploadBuffer = Buffer.alloc(pasteString.length)
  uploadBuffer.write(pasteString)
  messageDeleteBulkEvent.embed.fields.push({
    name: 'Link',
    value: 'Look at the file attached to this embed'
  })
  messageDeleteBulkEvent.file = {
    name: 'messages-deleted.txt',
    file: uploadBuffer
  }
  send(messageDeleteBulkEvent)
}

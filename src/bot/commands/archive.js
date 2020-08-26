const sa = require('superagent')

module.exports = {
  func: async (message, suffix) => {
    if (isNaN(suffix)) return message.channel.createMessage('That isn\'t a valid suffix! Please provide any number between 5 and 1000 (10,000 if Patreon).')
    const num = parseInt(suffix)
    if (num < 5 || num > 1000) return message.channel.createMessage('That number is invalid! Please provide any number between 5 and 1000 (10,000 if Patreon)')
    message.channel.getMessages(num).then(messages => {
      const pasteString = messages.reverse().map(m => `${m.author.username}#${m.author.discriminator} (${m.author.id}) | ${new Date(m.timestamp).toString()}: ${m.content ? m.content : ''} | ${m.embeds.length === 0 ? '' : `{"embeds": [${m.embeds.map(e => JSON.stringify(e))}]}`} | ${m.attachments.length === 0 ? '' : ` =====> Attachment: ${m.attachments[0].filename}:${m.attachments[0].url}`}`).join('\r\n')
      const uploadBuffer = Buffer.alloc(pasteString.length)
      uploadBuffer.write(pasteString)
      message.channel.createMessage('Your requested messages', { name: 'upload.txt', file: uploadBuffer })
    })
  },
  name: 'archive',
  description: 'Makes a log of up to the last 1000 messages in a channel. Example: archive 100 | archive 1000. Patreon bot only: fetch 10,000 messages!',
  category: 'Utility',
  perm: 'manageMessages'
}

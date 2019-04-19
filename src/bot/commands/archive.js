const sa = require('superagent')

module.exports = {
  func: async (message, suffix) => {
    if (isNaN(suffix)) return message.channel.createMessage('That isn\'t a valid suffix! Please provide any number between 5 and 1000 (10,000 if Patreon).')
    const num = parseInt(suffix)
    if (num < 5 || num > 1000) return message.channel.createMessage('That number is invalid! Please provide any number between 5 and 1000 (10,000 if Patreon)')
    message.channel.getMessages(num).then(messages => {
      const pasteString = messages.reverse().map(m => `${m.author.username}#${m.author.discriminator} (${m.author.id}) | (${m.author.avatarURL}) | ${new Date(m.timestamp)}: ${m.content ? m.content : ''} | ${m.embeds.length === 0 ? '' : `{"embeds": [${m.embeds.map(e => JSON.stringify(e))}]}`} | ${m.attachments.length === 0 ? '' : ` =====> Attachment: ${m.attachments[0].filename}:${m.attachments[0].url}`}`).join('\r\n')
      sa
        .post(process.env.PASTE_CREATE_ENDPOINT)
        .send({
          data: pasteString || 'An error has occurred while fetching pastes. Please contact the bot author.',
          private: true,
          language: 'text',
          title: message.channel.name.substr(0, 20),
          expire: '2592000'
        })
        .end((err, res) => {
          if (!err && res.statusCode === 200 && res.body.result.id) {
            message.channel.createMessage(`<@${message.author.id}>, **${messages.length}** message(s) could be archived. Link: https://paste.lemonmc.com/${res.body.result.id}/${res.body.result.hash}`)
          } else {
            global.logger.error(err, res.body)
            global.webhook.error('An error has occurred while posting to the paste website. Check logs for more.')
          }
        })
    })
  },
  name: 'archive',
  description: 'Archives up to the last 1000 messages in a channel. Example: archive 100 | archive 1000. Patreon bot only: fetch 10,000 messages!',
  type: 'admin',
  category: 'Utility'
}

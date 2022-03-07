const sa = require('superagent')

module.exports = {
  func: async (message, suffix) => {
    if (!suffix || isNaN(suffix)) return message.channel.createMessage('That isn\'t a valid suffix! Please provide any number between 5 and 1000 (10,000 if Patreon).')
    const num = parseInt(suffix)
    if (num < 5 || num > 1000) return message.channel.createMessage('That number is invalid! Please provide any number between 5 and 1000 (10,000 if Patreon)')
    message.channel.getMessages({ limit: num }).then(messages => {
      const pasteString = messages.reverse().filter(m => !m.applicationID).map(m => `${m.author.username}#${m.author.discriminator} (${m.author.id}) | ${new Date(m.timestamp).toUTCString()}: ${m.content ? m.content : ''} ${m.embeds.length === 0 ? '' : `| {"embeds": [${m.embeds.map(e => JSON.stringify(e))}]}`} | ${m.attachments.length === 0 ? '' : ` =====> Attachment: ${m.attachments[0].filename}:${m.attachments[0].url}`}`).join('\r\n')
      sa
        .post(process.env.PASTE_CREATE_ENDPOINT)
        .set('Authorization', process.env.PASTE_CREATE_TOKEN)
        .set('Content-Type', 'text/plain')
        .send(pasteString || 'No messages were able to be archived')
        .end((err, res) => {
          if (!err && res.statusCode === 200 && res.body.key) {
            message.channel.createMessage(`<@${message.author.id}>, **${messages.length}** message(s) could be archived. Link: https://haste.logger.bot/${res.body.key}.txt`)
          } else {
            global.logger.error(err, res.body)
            global.webhook.error('An error has occurred while posting to the paste website. Check logs for more.')
          }
        })
    })
  },
  name: 'archive',
  category: 'Utility',
  perm: 'manageMessages',
  quickHelp: 'Makes a log online of up to the last 1000 messages in a channel. Does NOT delete any messages. Patreon bot only: fetch 10,000 messages & [upgraded log site](https://logs.discord.website/logs/W9NbmmULEpxMFMoiBuKrYG)',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}archive 5\` <- lowest amount possible
  \`${process.env.GLOBAL_BOT_PREFIX}archive 1000\` <- maximum count of messages to archive
  \`${process.env.GLOBAL_BOT_PREFIX}archive 25\` <- create a log of the last 25 messages in the channel`
}

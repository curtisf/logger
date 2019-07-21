const sa = require('superagent')
const getMessageById = require('../../db/interfaces/postgres/read').getMessageById
const send = require('../modules/webhooksender')

module.exports = {
  name: 'messageDeleteBulk',
  type: 'on',
  handle: async messages => {
    let dbMessages = []
    await messages.forEach(async (m, i) => {
      const message = await getMessageById(m.id)
      if (message) dbMessages.push(message)
      if (i === messages.length - 1) await paste(dbMessages, messages[0].channel.guild.id)
    })
  }
}

async function paste(messages, guildID) {
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
        avatarURL: 'http://www.clker.com/cliparts/C/8/4/G/W/o/transparent-red-circle-hi.png'
      }
    }
    return `${globalUser.username}#${globalUser.discriminator} (${m.author_id}) | (${globalUser.avatarURL}) | ${new Date(m.ts)}: ${m.content} |  | `
  }).join('\r\n')
  sa
    .post(process.env.PASTE_CREATE_ENDPOINT)
    .set('Authorization', process.env.PASTE_CREATE_TOKEN)
    .set('Content-Type', 'text/plain')
    .send(pasteString || 'An error has occurred while fetching pastes. Please contact the bot author.')
    .end((err, res) => {
      if (!err && res.statusCode === 200 && res.body.key) {
        messageDeleteBulkEvent.embed.fields.push({
          name: 'Link',
          value: `https://haste.lemonmc.com/${res.body.key}.txt`
        })
        send(messageDeleteBulkEvent)
      } else {
        global.logger.error(err, res.body)
        global.webhook.error('An error has occurred while posting to the paste website. Check logs for more.')
      }
    })
}

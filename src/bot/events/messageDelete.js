const send = require('../modules/webhooksender')
const getMessage = require('../../db/interfaces/postgres/read').getMessageById
const deleteMessage = require('../../db/interfaces/postgres/delete').deleteMessage

module.exports = {
  name: 'messageDelete',
  type: 'on',
  handle: async message => {
    if (!message.channel.guild) return // TODO: do the same for message update
    let cachedMessage = await getMessage(message.id)
    if (!cachedMessage) return // later, add some new logic
    await deleteMessage(message.id)
    const cachedUser = global.bot.users.get(cachedMessage.author_id)
    // TODO: Add logic to check who deleted the message from audit logs for premium
    await send({
      guildID: message.channel.guild.id,
      eventName: 'messageDelete',
      embed: {
        author: {
          name: cachedUser ? `${cachedUser.username}#${cachedUser.discriminator}` : 'User not in cache',
          icon_url: cachedUser ? cachedUser.avatarURL : 'http://laoblogger.com/images/outlook-clipart-red-x-10.jpg'
        },
        description: `Message deleted in <#${message.channel.id}>`,
        fields: [{
          name: 'Content',
          value: cachedMessage.content ? cachedMessage.content : 'None'
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${cachedMessage.author_id}\nMessage = ${message.id}\`\`\``
        }, {
          name: 'Date',
          value: new Date(cachedMessage.ts)
        }],
        color: 3553599
      }
    })
  }
}

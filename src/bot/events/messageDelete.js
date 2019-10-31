const send = require('../modules/webhooksender')
const getMessageFromDB = require('../../db/interfaces/postgres/read').getMessageById
const getMessageFromBatch = require('../../db/messageBatcher').getMessage
const deleteMessage = require('../../db/interfaces/postgres/delete').deleteMessage
const cacheGuild = require('../utils/cacheGuild')

module.exports = {
  name: 'messageDelete',
  type: 'on',
  handle: async message => {
    if (!message.channel.guild) return
    const guildSettings = global.bot.guildSettingsCache[message.channel.guild.id]
    if (!guildSettings) await cacheGuild(message.channel.guild.id)
    if (global.bot.guildSettingsCache[message.channel.guild.id].isChannelIgnored(message.channel.id)) return
    let cachedMessage = await getMessageFromBatch(message.id)
    if (!cachedMessage) {
      cachedMessage = await getMessageFromDB(message.id)
    }
    if (!cachedMessage) return
    await deleteMessage(message.id)
    const cachedUser = global.bot.users.get(cachedMessage.author_id)
    const member = message.channel.guild.members.get(cachedMessage.author_id)
    let messageDeleteEvent = {
      guildID: message.channel.guild.id,
      eventName: 'messageDelete',
      embed: {
        author: {
          name: cachedUser ? `${cachedUser.username}#${cachedUser.discriminator} ${member && member.nick ? `(${member.nick})` : ''}` : 'User not in cache',
          icon_url: cachedUser ? cachedUser.avatarURL : 'http://laoblogger.com/images/outlook-clipart-red-x-10.jpg'
        },
        description: `Message deleted in <#${message.channel.id}>`,
        fields: [],
        color: 8530669
      }
    }
    const messageChunks = []
    if (cachedMessage.content) {
      if (cachedMessage.content.length > 1024) {
        messageChunks.push(cachedMessage.content.substring(0, 1023))
        messageChunks.push(cachedMessage.content.substring(1024, cachedMessage.content.length))
      } else {
        messageChunks.push(cachedMessage.content)
      }
    } else {
      messageChunks.push('None')
    }
    messageChunks.forEach((chunk, i) => {
        messageDeleteEvent.embed.fields.push({
          name: i === 0 ? 'Content' : 'Continued',
          value: chunk
        })
    })
    messageDeleteEvent.embed.fields.push({
      name: 'ID',
      value: `\`\`\`ini\nUser = ${cachedMessage.author_id}\nMessage = ${cachedMessage.id}\`\`\``
    }, {
      name: 'Date',
      value: new Date(cachedMessage.ts)
    })
    await send(messageDeleteEvent)
  }
}

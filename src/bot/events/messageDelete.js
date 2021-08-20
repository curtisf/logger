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
    let cachedUser = global.bot.users.get(cachedMessage.author_id)
    if (!cachedUser) {
      try {
        cachedUser = await message.channel.guild.getRESTMember(cachedMessage.author_id)
        message.channel.guild.members.add(cachedUser, global.bot)
      } catch (_) {
        // either the member does not exist or the person left and others are deleting their messages
      }
    }
    const member = message.channel.guild.members.get(cachedMessage.author_id)
    const messageDeleteEvent = {
      guildID: message.channel.guild.id,
      eventName: 'messageDelete',
      embeds: [{
        author: {
          name: cachedUser ? `${cachedUser.username}#${cachedUser.discriminator} ${cachedUser && cachedUser.nick ? `(${member.nick})` : ''}` : `Unknown User <@${cachedMessage.author_id}>`,
          icon_url: cachedUser ? cachedUser.avatarURL : 'https://logger.bot/staticfiles/red-x.png'
        },
        description: `Message deleted in <#${message.channel.id}>`,
        fields: [],
        color: 8530669
      }]
    }
    let messageChunks = []
    if (cachedMessage.content) {
      if (cachedMessage.content.length > 1000) {
        messageChunks = chunkify(cachedMessage.content.replace(/\"/g, '"').replace(/`/g, ''))
      } else {
        messageChunks.push(cachedMessage.content)
      }
    } else {
      messageChunks.push('<no message content>')
    }
    messageChunks.forEach((chunk, i) => {
      messageDeleteEvent.embeds[0].fields.push({
        name: i === 0 ? 'Content' : 'Continued',
        value: chunk
      })
    })
    messageDeleteEvent.embeds[0].fields.push({
      name: 'Date',
      value: `<t:${Math.round(cachedMessage.ts / 1000)}:F>`
    }, {
      name: 'ID',
      value: `\`\`\`ini\nUser = ${cachedMessage.author_id}\nMessage = ${cachedMessage.id}\`\`\``
    })
    await send(messageDeleteEvent)
  }
}

function chunkify (toChunk) {
  const lenChunks = Math.ceil(toChunk.length / 1000)
  const chunksToReturn = []
  for (let i = 0; i < lenChunks; i++) {
    const chunkedStr = toChunk.substring((1000 * i), i === 0 ? 1000 : 1000 * (i + 1))
    chunksToReturn.push(chunkedStr)
  }
  return chunksToReturn
}

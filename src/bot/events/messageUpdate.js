const send = require('../modules/webhooksender')
const updateMessageByID = require('../../db/interfaces/sqlite').updateMessageByID
const getMessageFromDB = require('../../db/interfaces/sqlite').getMessageById
const getMessageFromBatch = require('../../db/messageBatcher').getMessage
const escape = require('markdown-escape')

// markdown-escape is a single exported function, I probably don't need it as a node module lol

module.exports = {
  name: 'messageUpdate',
  type: 'on',
  handle: async (newMessage, oldMessage) => {
    if (!newMessage.channel.guild || !newMessage.author) return
    if (newMessage.author.id === global.bot.user.id) return
    const member = newMessage.channel.guild.members.get(newMessage.author.id) // this member "should" be in cache at all times
    oldMessage = await getMessageFromBatch(newMessage.id)
    if (!oldMessage) {
      oldMessage = await getMessageFromDB(newMessage.id)
    }
    if (!oldMessage) return
    if (newMessage.author.bot) {
      if (global.bot.global.guildSettingsCache[newMessage.channel.guild.id].isLogBots()) await processMessage(newMessage, oldMessage)
    } else if (newMessage.content !== oldMessage.content) {
      await processMessage(newMessage, oldMessage)
    }
    async function processMessage (newMessage, oldMessage) {
      const messageUpdateEvent = {
        guildID: newMessage.channel.guild.id,
        eventName: 'messageUpdate',
        embed: {
          author: {
            name: `${newMessage.author.username}#${newMessage.author.discriminator} ${member && member.nick ? `(${member.nick})` : ''}`,
            icon_url: newMessage.author.avatarURL
          },
          description: `**${newMessage.author.username}#${newMessage.author.discriminator}** ${member && member.nick ? `(${member.nick})` : ''} updated their message in: ${newMessage.channel.name}.`,
          fields: [{
            name: 'Channel',
            value: `<#${newMessage.channel.id}> (${newMessage.channel.name})\n[Go To Message](https://discord.com/channels/${newMessage.channel.guild.id}/${newMessage.channel.id}/${newMessage.id})`
          }],
          color: 15084269
        }
      }
      if (!newMessage.content) return // if no content why log it? normal users don't have image logging anyways
      let nowChunks, beforeChunks
      if (newMessage.content.length > 1000) {
        nowChunks = chunkify(escape(newMessage.content.replace(/~/g, '\\~'), ['angle brackets']).replace(/\"/g, '"').replace(/`/g, ''))
      } else {
        nowChunks = [escape(newMessage.content.replace(/~/g, '\\~'), ['angle brackets'])]
      }

      if (oldMessage.content.length > 1000) {
        beforeChunks = chunkify(oldMessage.content.replace(/\"/g, '"').replace(/`/g, ''))
      } else {
        beforeChunks = [oldMessage.content]
      }
      if (nowChunks.length === 0) {
        nowChunks.push('<no message content>')
      }
      if (beforeChunks.length === 0) {
        beforeChunks.push('<no message content>')
      }
      nowChunks.forEach((chunk, i) => {
        messageUpdateEvent.embed.fields.push({
          name: i === 0 ? 'Now' : 'Now Continued',
          value: chunk
        })
      })
      beforeChunks.forEach((chunk, i) => {
        messageUpdateEvent.embed.fields.push({
          name: i === 0 ? 'Previous' : 'Previous Continued',
          value: chunk // previous is already escaped, don't escape again
        })
      })
      messageUpdateEvent.embed.fields.push({
        name: 'ID',
        value: `\`\`\`ini\nUser = ${newMessage.author.id}\nMessage = ${newMessage.id}\`\`\``
      })
      await updateMessageByID(newMessage.id, newMessage.content)
      await send(messageUpdateEvent)
    }
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

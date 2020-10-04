const send = require('../modules/webhooksender')
const updateMessageByID = require('../../db/interfaces/postgres/update').updateMessageByID
const getMessageFromDB = require('../../db/interfaces/postgres/read').getMessageById
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
            value: `<#${newMessage.channel.id}> (${newMessage.channel.name})\n[Go To Message](https://discordapp.com/channels/${newMessage.channel.guild.id}/${newMessage.channel.id}/${newMessage.id})`
          }],
          color: 15084269
        }
      }
      const nowChunks = []
      const beforeChunks = []
      if (newMessage.content) {
        newMessage.content = escape(newMessage.content.replace(/~/g, '\\~'), ['angle brackets'])
        if (newMessage.content.length > 1000) {
          nowChunks.push(newMessage.content.replace(/\"/g, '"').replace(/`/g, '').substring(0, 1000))
          nowChunks.push(newMessage.content.replace(/\"/g, '"').replace(/`/g, '').substring(1001, newMessage.content.length))
        } else {
          nowChunks.push(newMessage.content)
        }
      } else {
        nowChunks.push('None')
      }
      if (oldMessage.content) {
        if (oldMessage.content.length > 1000) {
          beforeChunks.push(oldMessage.content.replace(/\"/g, '"').replace(/`/g, '').substring(0, 1000))
          beforeChunks.push(oldMessage.content.replace(/\"/g, '"').replace(/`/g, '').substring(1001, oldMessage.content.length))
        } else {
          beforeChunks.push(oldMessage.content)
        }
      } else {
        beforeChunks.push('None')
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

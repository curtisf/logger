const clearEventByID = require('../../db/interfaces/postgres/update').clearEventByID
const cacheGuild = require('../utils/cacheGuild')
const setEventLogs = require('../../db/interfaces/postgres/update').setEventsLogId
const eventList = require('../utils/constants').ALL_EVENTS

module.exports = {
  func: async (message, suffix) => {
    if (!message.channel.guild.members.get(global.bot.user.id).permissions.json.sendMessages) {
      return
    }

    let events = suffix.split(', ')
    events = cleanArray(events)
    if (events.length === 0 && suffix) {
      message.channel.createMessage(`<@${message.author.id}>, none of the provided events are valid to be unset. Look at ${process.env.GLOBAL_BOT_PREFIX}help to see what is valid.`)
    } else if (suffix && events.length !== 0) {
      await setEventLogs(message.channel.guild.id, '', events)
      await cacheGuild(message.channel.guild.id)
      message.channel.createMessage(`<@${message.author.id}>, your selected events will not be logged here anymore.`)
    } else if (!suffix) {
      await clearEventByID(message.channel.guild.id, message.channel.id) // any event logging to this channel id will be wiped

      await message.channel.createMessage({
        embeds: [{
          title: 'Any events associated with this channel have been undone.',
          color: 16711680,
          timestamp: new Date(),
          footer: {
            icon_url: global.bot.user.avatarURL,
            text: `${global.bot.user.username}#${global.bot.user.discriminator}`
          },
          author: {
            name: `${message.author.username}#${message.author.discriminator}`,
            icon_url: message.author.avatarURL
          },
          fields: []
        }]
      })
    }
  },
  name: 'stoplogging',
  quickHelp: 'Use this in a log channel to stop me from logging certain (or all) events. This command is the opposite of setchannel and can be used the same way to unset events instead of setting them.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}stoplogging\` <- stops logging every event configured to log to the channel it's used in
  \`${process.env.GLOBAL_BOT_PREFIX}stoplogging messageDelete, messageUpdate\` <- if the bot was logging messageDelete and messageUpdate to the channel this is used in, now it is unset
  \`${process.env.GLOBAL_BOT_PREFIX}stoplogging guildMemberVerify\` <- if the bot was logging member verify events to the channel this was used in, it will stop doing so`,
  type: 'admin',
  noThread: true,
  category: 'Logging'
}

function cleanArray (events) {
  const tempEvents = []
  events.forEach(event => {
    if (eventList.includes(event)) {
      eventList.forEach(validEvent => {
        const lowerEvent = validEvent.toLowerCase()
        const upperEvent = validEvent.toUpperCase()
        if (event === lowerEvent || event === upperEvent || event === validEvent) {
          tempEvents.push(validEvent)
        }
      })
    }
  })
  return tempEvents
}

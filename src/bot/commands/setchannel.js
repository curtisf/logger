const webhookCache = require('../modules/webhookcache')
const clearEventByID = require('../../db/interfaces/postgres/update').clearEventByID
const setEventLogs = require('../../db/interfaces/postgres/update').setEventsLogId
const setAllOneID = require('../../db/interfaces/postgres/update').setAllEventsOneId
const cacheGuild = require('../utils/cacheGuild')

const eventList = [
  'channelCreate',
  'channelUpdate',
  'channelDelete',
  'guildBanAdd',
  'guildBanRemove',
  'guildRoleCreate',
  'guildRoleDelete',
  'guildRoleUpdate',
  'guildUpdate',
  'messageDelete',
  'messageDeleteBulk',
  'messageReactionRemoveAll',
  'messageUpdate',
  'guildMemberAdd',
  'guildMemberKick',
  'guildMemberRemove',
  'guildMemberUpdate',
  'voiceChannelLeave',
  'voiceChannelJoin',
  'voiceStateUpdate',
  'voiceChannelSwitch',
  'guildEmojisUpdate',
  'guildMemberNickUpdate'
]

module.exports = {
  func: async (message, suffix) => {
    const webhookPerm = message.channel.permissionsOf(global.bot.user.id).json['manageWebhooks']
    if (!webhookPerm) return await message.channel.createMessage('I lack the manage webhooks permission! This is necessary for me to send messages to your configured logging channel.')
    let events = suffix.split(', ')
    events = cleanArray(events)
    if (events.length === 0 && suffix) {
      message.channel.createMessage(`<@${message.author.id}>, none of the provided events are valid. Look at ${process.env.GLOBAL_BOT_PREFIX}help to see what is valid.`)
    } else if (events.length === 0 && !suffix) {
      await setAllOneID(message.channel.guild.id, message.channel.id)
      await cacheGuild(message.channel.guild.id)
      message.channel.createMessage(`<@${message.author.id}>, I set all events to log here!`)
    } else {
      await setEventLogs(message.channel.guild.id, message.channel.id, events)
      await cacheGuild(message.channel.guild.id)
      message.channel.createMessage(`<@${message.author.id}>, it has been done.`)
    }
  },
  name: 'setchannel',
  description: `Use this in a log channel to make me log to here. setchannel without any suffix will set all events to the current channel. Otherwise, you can use *${eventList.toString(', ')}* any further components being comma separated. Example: ${process.env.GLOBAL_BOT_PREFIX}setchannel messageDelete, messageUpdate`,
  perm: 'manageWebhooks',
  category: 'Logging'
}

function cleanArray (events) {
  const tempEvents = []
  events.forEach(event => {
    if (eventList.includes(event)) isGood = true
    eventList.forEach(validEvent => {
      const lowerEvent = validEvent.toLowerCase()
      const upperEvent = validEvent.toUpperCase()
      if (event === lowerEvent || event === upperEvent || event === validEvent) {
        tempEvents.push(validEvent)
      }
    })
  })
  return tempEvents
}

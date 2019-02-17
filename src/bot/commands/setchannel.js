const webhookCache = require('../modules/webhookcache')
const clearEventByID = require('../../db/interfaces/postgres/update').clearEventByID
const setEventLogs = require('../../db/interfaces/postgres/update').setEventsLogId
const setAllOneID = require('../../db/interfaces/postgres/update').setAllEventsOneId

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
  'guildEmojisUpdate'
]

module.exports = {
  func: async (message, suffix) => {
    let events = suffix.split(', ')
    events = cleanArray(events)
    const hookStr = await webhookCache.getWebhook(message.channel.id)
    try {
      global.bot.executeWebhook()
      console.log(hookStr)
    } catch (_) {}
    if (events.length === 0) {
      await setAllOneID(message.channel.guild.id, message.channel.id)
      global.bot.guildSettingsCache[message.channel.guild.id].recache()
      message.channel.createMessage(`<@${message.author.id}>, I set all events to log here!`)
    } else {
      await setEventLogs(message.channel.guild.id, message.channel.id, events)
      global.bot.guildSettingsCache[message.channel.guild.id].recache()
      message.channel.createMessage(`<@${message.author.id}>, it has been done.`)
    }
  },
  name: 'setchannel',
  description: 'Use this in a log channel to stop me from logging to here. setchannel without any suffix will set all events to the current channel. Otherwise, you can use *setchannel messageCreate, messageDelete* any further components being comma separated',
  type: 'admin',
  category: 'Logging'
}

function cleanArray(events) {
  const tempEvents = []
  events.forEach(event => {
    if (eventList.includes(event)) tempEvents.push(event)
  })
  return tempEvents
}

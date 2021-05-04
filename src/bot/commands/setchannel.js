const webhookCache = require('../modules/webhookcache')
const clearEventByID = require('../../db/interfaces/sqlite').clearEventByID
const setEventLogs = require('../../db/interfaces/sqlite').setEventsLogId
const setAllOneID = require('../../db/interfaces/sqlite').setAllEventsOneId
const cacheGuild = require('../utils/cacheGuild')
const guildWebhookCacher = require('../modules/guildWebhookCacher')

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
  'messageUpdate',
  'guildMemberAdd',
  'guildMemberKick',
  'guildMemberRemove',
  'guildMemberUpdate',
  'voiceChannelLeave',
  'voiceChannelJoin',
  'voiceStateUpdate',
  'voiceChannelSwitch',
  'guildMemberNickUpdate',
  'guildMemberVerify'
]

module.exports = {
  func: async (message, suffix) => {
    const botPerms = message.channel.permissionsOf(global.bot.user.id).json
    if (!botPerms.manageWebhooks) {
      message.channel.createMessage('I lack the manage webhooks permission! This is necessary for me to send messages to your configured logging channel.').catch(_ => {})
      message.addReaction('❌').catch(_ => {})
      return
    }
    let events = suffix.split(', ')
    events = cleanArray(events)
    if (events.length === 0 && suffix) {
      message.channel.createMessage(`<@${message.author.id}>, none of the provided events are valid. Look at ${global.envInfo.GLOBAL_BOT_PREFIX}help to see what is valid.`)
    } else if (events.length === 0 && !suffix) {
      await setEventLogs(message.channel.guild.id, message.channel.id, eventList)
      await cacheGuild(message.channel.guild.id)
      await guildWebhookCacher(message.channel.guild.id, message.channel.id)
      message.channel.createMessage(`<@${message.author.id}>, I set all events to log here! ${!botPerms.manageChannels || !botPerms.manageGuild ? 'Join logging will not work until I\'m granted manage channels & manage server (I cannot get invite information without both!)' : ''}`)
    } else {
      await setEventLogs(message.channel.guild.id, message.channel.id, events)
      await cacheGuild(message.channel.guild.id)
      await guildWebhookCacher(message.channel.guild.id, message.channel.id)
      message.channel.createMessage(`<@${message.author.id}>, it has been done. ${events.includes('guildMemberAdd') && (!botPerms.manageChannels || !botPerms.manageGuild) ? 'Join logging will not work until I\'m granted manage channels & manage server (I cannot get invite information without both!)' : ''}`)
    }
  },
  name: 'setchannel',
  quickHelp: 'The [dashboard](https://logger.bot) is the easiest way to setup! Setchannel configures bot logging behavior.',
  examples: `\`${global.envInfo.GLOBAL_BOT_PREFIX}setchannel\` <- log everything where this is sent
  \`${global.envInfo.GLOBAL_BOT_PREFIX}setchannel messageDelete, messageUpdate\` <- logs message deletions and updates
  \`${global.envInfo.GLOBAL_BOT_PREFIX}setchannel guildMemberAdd, guildMemberRemove, guildMemberKick\` <- logs when someone joins, leaves, or is kicked **(YOU MUST ALLOW LOGGER __MANAGE CHANNELS AND MANAGE SERVER__ FOR JOIN LOGGING TO WORK! Why? Discord does not send invite info without it!)**
  \`${global.envInfo.GLOBAL_BOT_PREFIX}setchannel anyevent\` <- individually set events to log to the channel this is used in. Supports multiple events at a time. Valid events:
  \`\`\`${eventList.toString(',')}\`\`\``, // 4 characters away from max embed length
  perm: 'manageWebhooks',
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

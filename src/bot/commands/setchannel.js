const { setEventsLogId } = require('../../db/interfaces/postgres/update')
const guildWebhookCacher = require('../modules/guildWebhookCacher')
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
  'guildMemberVerify',
  'guildEmojisUpdate',
  'guildStickersUpdate',
  'guildMemberBoostUpdate'
]

module.exports = {
  func: async (message, suffix) => {
    const botPerms = message.channel.permissionsOf(global.bot.user.id).json
    if (!botPerms.manageWebhooks || !botPerms.viewAuditLogs) {
      message.channel.createMessage('I need manage webhooks and view audit logs permissions to run setchannel! This is necessary for me to send messages to your configured logging channel.').catch(_ => {})
      message.addReaction('❌').catch(_ => {})
      return
    }
    let events = suffix.split(', ')
    events = cleanArray(events)
    if (events.length === 0 && suffix) {
      message.channel.createMessage(`<@${message.author.id}>, none of the provided events are valid. Look at ${process.env.GLOBAL_BOT_PREFIX}help to see what is valid.`)
    } else if (events.length === 0 && !suffix) {
      await setEventsLogId(message.channel.guild.id, message.channel.id, eventList)
      await cacheGuild(message.channel.guild.id)
      await guildWebhookCacher(message.channel.guild.id, message.channel.id)
      message.channel.createMessage(`<@${message.author.id}>, I set all events to log here! ${!botPerms.manageChannels || !botPerms.manageGuild ? 'Invite tracking will not work until I\'m granted manage channels & manage server (I cannot get invite information without both!)' : ''}`)
    } else {
      await setEventsLogId(message.channel.guild.id, message.channel.id, events)
      await cacheGuild(message.channel.guild.id)
      await guildWebhookCacher(message.channel.guild.id, message.channel.id)
      message.channel.createMessage(`<@${message.author.id}>, it has been done. ${events.includes('guildMemberAdd') && (!botPerms.manageChannels || !botPerms.manageGuild) ? 'Invite tracking will not work until I\'m granted manage channels & manage server (I cannot get invite information without both!)' : ''}`)
    }
  },
  name: 'setchannel',
  quickHelp: 'The [dashboard](https://logger.bot) is the easiest way to setup! Setchannel configures bot logging behavior.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}setchannel\` <- log everything where this is sent
  \`${process.env.GLOBAL_BOT_PREFIX}setchannel messageDelete, messageUpdate\` <- logs message deletions and updates
  \`${process.env.GLOBAL_BOT_PREFIX}setchannel guildMemberAdd, guildMemberRemove, guildMemberKick\` <- joins, leaves, kicks logging **(YOU MUST ALLOW LOGGER __MANAGE CHANNELS AND MANAGE SERVER__ FOR INVITE TRACKING TO WORK! Why? Discord does not send invite info without it!)**
  \`${process.env.GLOBAL_BOT_PREFIX}setchannel anyevent\` <- set events one-by-one to log. Use commas for multiple. Valid events:
  \`\`\`${eventList.toString(',')}\`\`\``, // 4 characters away from max embed length
  perms: ['manageWebhooks', 'manageChannels', 'viewAuditLogs'],
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

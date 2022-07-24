const cacheGuild = require('../utils/cacheGuild')

// I generally hate middleware associated with events, but this could potentially save
// a whole lot on resources and audit log fetching if pulled off correctly.

module.exports = async (event, type) => {
  if (type === 'on') {
    global.bot.on(event.name, async (...args) => {
      const guildId = getGuildIdByEvent(event.name, args)

      if (!guildId) {
        global.logger.warn(`While executing event ${event.name}, a guild ID was not returned!`)
      } else if (guildId === true) { // when true, don't fetch event logs
        await event.handle.apply(this, args)
      } else {
        if (!global.bot.guildSettingsCache[guildId]) {
          await cacheGuild(guildId)
        }

        const logChannel = global.bot.guildSettingsCache[guildId].event_logs[event.name] && global.bot.getChannel(global.bot.guildSettingsCache[guildId].event_logs[event.name])
        if (!logChannel) return

        const botPerms = logChannel.permissionsOf(global.bot.user.id).json

        if (!botPerms.manageWebhooks || !botPerms.viewAuditLog) return

        // so far, this perm check is only needed for guild member add (fetch invites)
        if (event.requiredPerms && event.requiredPerms?.length !== 0) {
          for (let i = 0; i < event.requiredPerms.length; i++) {
            if (!botPerms[event.requiredPerms[i]]) return
          }
        }

        if (guildId !== true && !global.bot.guildSettingsCache[guildId]) return // true means skip guildsettings fetch
        if (guildId !== true && global.bot.guildSettingsCache[guildId].eventIsDisabled(event.name)) return
        await event.handle.apply(this, args)
      }
    })
  } else if (type === 'once') {
    global.bot.once(event.name, async (...args) => {
      await event.handle.apply(this, args)
    })
  }
}

// Return the id of the guild to prevent event processing if not configured by the user.
// IDs get checked for the presence of a configuration, while true is executed without a settings check.
function getGuildIdByEvent (type, args) {
  switch (type) {
    case 'channelCreate':
    case 'channelDelete':
    case 'channelUpdate': {
      return args[0].guild.id
    }
    case 'guildBanAdd':
    case 'guildBanRemove':
    case 'guildEmojisUpdate':
    case 'guildMemberAdd':
    case 'guildMemberUpdate':
    case 'guildRoleCreate':
    case 'guildRoleDelete':
    case 'guildRoleUpdate':
    case 'guildUpdate': {
      return args[0]?.id
    }
    case 'voiceChannelJoin':
    case 'voiceChannelLeave':
    case 'voiceStateUpdate': {
      return args[0]?.guild?.id // voiceStateUpdate can return just a user id and cached voice state
    }
    case 'inviteDelete':
    case 'inviteCreate': {
      return true // yes this coulda been left to default, but this explicitly states the purpose. This needs to run whether it's configured or not
    }
    case 'messageDeleteBulk': {
      if (!args[0][0].channel.guild.id) return
      return args[0][0].channel.guild.id // this is fine because discord will atleast send message id and channel
    }
    default: {
      return true
    }
  }
}

const { setEventsLogId, setEventsRawLogs } = require('../../db/interfaces/postgres/update')
const guildWebhookCacher = require('../modules/guildWebhookCacher')
const cacheGuild = require('../utils/cacheGuild')
const { v4: uuidv4 } = require('uuid')
const { PRESET_EVENT_MAP } = require('../utils/constants')

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
  'guildMemberBoostUpdate'
]

const allEventOptions = [{
  label: 'Channel Create',
  value: 'channelCreate',
  description: 'Upon channel creation'
}, {
  label: 'Channel Delete',
  value: 'channelDelete',
  description: 'Upon channel deletion'
}, {
  label: 'Channel Update',
  value: 'channelUpdate',
  description: 'Upon channel update (name, permissions, etc)'
}, {
  label: 'Member Ban',
  value: 'guildBanAdd',
  description: 'Upon member banned'
}, {
  label: 'Member Unban',
  value: 'guildBanRemove',
  description: 'Upon member unban'
}, {
  label: 'Emoji Update',
  value: 'guildEmojisUpdate',
  description: 'Upon emoji create/delete/update'
}, {
  label: 'Member Join',
  value: 'guildMemberAdd',
  description: 'Upon member join (manage channels + server perms)'
}, {
  label: 'Member Kick',
  value: 'guildMemberKick',
  description: 'Upon member kicked'
}, {
  label: 'Member Leave',
  value: 'guildMemberRemove',
  description: 'Upon member leave'
}, {
  label: 'Member Roles Update',
  value: 'guildMemberUpdate',
  description: 'Upon member role add/remove'
}, {
  label: 'Member Nickname Update',
  value: 'guildMemberNickUpdate',
  description: 'Upon member nickname change - may NOT work!'
}, {
  label: 'Member Boost Server',
  value: 'guildMemberBoostUpdate',
  description: 'Upon member boost/unboost server'
}, {
  label: 'Member Verify',
  value: 'guildMemberVerify',
  description: 'Upon member passing community role gate'
}, {
  label: 'Message Delete',
  value: 'messageDelete',
  description: 'Upon a message being deleted'
}, {
  label: 'Message Bulk Delete',
  value: 'messageDeleteBulk',
  description: 'Upon a message purge (ban, bot-induced)'
}, {
  label: 'Message Update',
  value: 'messageUpdate',
  description: 'Upon a message purge (ban, bot-induced)'
}, {
  label: 'Member Join Voice Channel',
  value: 'voiceChannelJoin',
  description: 'Upon member joining a voice channel from none'
}, {
  label: 'Member Left Voice Channel',
  value: 'voiceChannelLeave',
  description: 'Upon member leaving a voice channel'
}, {
  label: 'Member Swap Voice Channel',
  value: 'voiceChannelSwitch',
  description: 'Upon member leaving + joining a new voice channel'
}, {
  label: 'Member Voicestate Update',
  value: 'voiceStateUpdate',
  description: 'Upon member being server muted/deafened'
}, {
  label: 'Role Create',
  value: 'guildRoleCreate',
  description: 'Upon a role being created'
}, {
  label: 'Role Delete',
  value: 'guildRoleDelete',
  description: 'Upon a role being deleted'
}, {
  label: 'Role Update',
  value: 'guildRoleUpdate',
  description: 'Upon a role being modified (name, perms)'
}, {
  label: 'Server Update',
  value: 'guildUpdate',
  description: 'Upon server modification (settings)'
}]

const allPresetOptions = [{
  label: 'Channel-Related Events',
  value: 'channel',
  description: 'Channel create/delete/update'
}, {
  label: 'Role-Related Events',
  value: 'role',
  description: 'Role create/delete/update'
}, {
  label: 'Join-Related Events',
  value: 'joinlog',
  description: 'Member join/leave'
}, {
  label: 'Message-Related Events',
  value: 'messages',
  description: 'Message update/delete/bulk delete'
}, {
  label: 'Voice-Related Events',
  value: 'voice',
  description: 'Voice channel join/leave/switch'
}, {
  label: 'Moderation-Related Events',
  value: 'moderation',
  description: 'Member kick and ban'
}, {
  label: 'Member-Related Events',
  value: 'member',
  description: 'Member role add/remove/verify/boost/nick update'
}, {
  label: 'Server Settings Events',
  value: 'server',
  description: 'Server settings update (name, etc)'
}]

async function buildDefaultsEventsOptions (guildID, channelID) {
  if (!global.bot.guildSettingsCache[guildID]) {
    await cacheGuild(guildID)
    if (!global.bot.guildSettingsCache[guildID]) return // probably left the server
  }
  return allEventOptions.map(option => {
    if (global.bot.guildSettingsCache[guildID].event_logs[option.value] === channelID) {
      option.default = true
    }
    return option
  })
}

async function buildDefaultsPresetsOptions (guildID, channelID) {
  let guildSettings = global.bot.guildSettingsCache[guildID]
  console.log('gsc', guildSettings.event_logs)
  if (!guildSettings) {
    await cacheGuild(guildID)
    guildSettings = global.bot.guildSettingsCache[guildID]
    if (!guildSettings) return // probably left the server
  }
  return allPresetOptions.map(preset => {
    const configuredEventsForPreset = []
    console.log('preset builder for this preset', preset.value)
    PRESET_EVENT_MAP[preset.value].forEach(presetEvent => {
      if (guildSettings.event_logs[presetEvent] === channelID) {
        configuredEventsForPreset.push(presetEvent)
      }
    })
    console.log('builder sees this match:', configuredEventsForPreset.length, '/', PRESET_EVENT_MAP[preset.value].length)
    if (configuredEventsForPreset.length === PRESET_EVENT_MAP[preset.value].length) {
      console.log('so gonna set that one to true')
      preset.default = true
    } else {
      preset.default = false
    }
    return preset
  })
}

module.exports = {
  func: async (message, suffix) => {
    const { awaitCustomID } = require('../events/interactionCreate')
    const logToChannelID = message.channelMentions.length !== 0 ? message.channelMentions[0] : message.channel.id
    const logToChannel = global.bot.getChannel(logToChannelID)
    if (!logToChannel) {
      return message.channel.createMessage(`<@${message.author.id}>, the selected channel does not exist.`)
    }
    const botPerms = logToChannel.permissionsOf(global.bot.user.id).json
    if (!botPerms.manageWebhooks) {
      message.channel.createMessage('I lack the manage webhooks permission! This is necessary for me to send messages to your configured logging channel.').catch(_ => {})
      message.addReaction('❌').catch(_ => {})
      return
    }
    const selectRouteID = uuidv4()
    const initialConfigMessage = await message.channel.createMessage({
      embeds: [{
        title: 'Logger Configuration',
        description: `Welcome to the Logger configuration tool! Use the select menu below to select events to log to <#${logToChannel.id}> ${message.channelMentions.length !== 0 ? `(${logToChannel.name})` : '(here)'}`,
        color: 0x05adb2,
        thumbnail: {
          url: message.member.avatarURL
        }
      }],
      components: [{
        type: 1,
        components: [{
          type: 3,
          custom_id: selectRouteID,
          placeholder: 'Select your route...',
          options: [{
            label: 'Preset',
            value: 'preset',
            description: 'Configure using default presets'
          }, {
            label: 'Individual',
            value: 'individual',
            description: 'Configure event-by-event for max customization'
          }]
        }]
      }]
    })
    let routeName
    try {
      const routeNameInteraction = await awaitCustomID(selectRouteID, message.author.id)
      routeName = routeNameInteraction.data.values[0]
      if (!routeName) message.delete().catch(() => {}) // ignore modded clients sending bad data
    } catch (_) {
      console.error('err ruh', _)
      return message.delete().catch(() => {})
    }
    if (routeName === 'individual') {
      const individualEventUUID = uuidv4()
      try {
        await initialConfigMessage.edit({
          embeds: [{
            title: 'Logger Configuration',
            description: `Welcome to the Logger configuration tool! Use the select menu below to select events to log to <#${logToChannel.id}> ${message.channelMentions.length !== 0 ? `(${logToChannel.name})` : '(here)'}`,
            color: 0x05adb2,
            thumbnail: {
              url: message.member.avatarURL
            }
          }],
          components: [{
            type: 1,
            components: [{
              type: 3,
              custom_id: individualEventUUID,
              max_values: allEventOptions.length,
              min_values: 1,
              placeholder: 'Select events to log...',
              options: await buildDefaultsEventsOptions(message.channel.guild.id, logToChannel.id)
            }]
          }]
        })
      } catch (_) {}
      try {
        const individualEventPayload = await awaitCustomID(individualEventUUID, message.author.id)
        const eventsToLog = cleanEventsArray(individualEventPayload.data.values)
        if (eventsToLog.length !== 0) {
          await setEventsLogId(message.channel.guild.id, logToChannel.id, eventsToLog)
        } else {
          await setEventsLogId(message.channel.guild.id, '', eventList)
        }
        await initialConfigMessage.edit({
          embeds: [{
            title: 'Logger Configuration Successful',
            description: `Success! I will log the selected events to <#${logToChannel.id}>`,
            color: 0x05adb2,
            thumbnail: {
              url: message.member.avatarURL
            },
            components: [{
              type: 1,
              components: [{
                type: 3,
                custom_id: individualEventUUID,
                max_values: allEventOptions.length,
                min_values: 1,
                placeholder: 'Select events to log...',
                options: await buildDefaultsEventsOptions(message.channel.guild.id, logToChannel.id)
              }]
            }]
          }]
        })
        setTimeout(() => {
          initialConfigMessage.delete().catch(() => {})
        }, 60000)
      } catch (_) {
        initialConfigMessage.delete().catch(() => {})
      }
    } else if (routeName === 'preset') {
      await renderPresetConfig(message.channel.guild.id, logToChannel.id, initialConfigMessage, message.author.id)
    }
  },
  name: 'setup',
  quickHelp: 'The [dashboard](https://logger.bot) is the easiest way to setup! Setup configures bot logging behavior.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}setup\` <- begin setup in current channel
  \`${process.env.GLOBAL_BOT_PREFIX}setup #channel-mention\` <- begin setup in the mentioned channel`,
  perm: 'manageWebhooks',
  noThread: true,
  category: 'Logging'
}

async function renderPresetConfig (guildID, logChannelID, messageToEdit, authorID) {
  const { awaitCustomID } = require('../events/interactionCreate')
  const presetEventUUID = uuidv4()
  try {
    await messageToEdit.edit({
      embeds: [{
        title: 'Logger Configuration',
        description: `Welcome to the Logger configuration tool! Use the select menu below to select presets to log to <#${logChannelID}>`,
        color: 0x05adb2
      }],
      components: [{
        type: 1,
        components: [{
          type: 3,
          custom_id: presetEventUUID,
          min_values: 0,
          max_values: allPresetOptions.length,
          placeholder: 'Select presets to use...',
          options: await buildDefaultsPresetsOptions(guildID, logChannelID)
        }]
      }]
    })
  } catch (_) {}
  try {
    const presetEventPayload = await awaitCustomID(presetEventUUID, authorID)
    const eventsToLog = presetsToEvents(presetEventPayload.data.values)
    console.log('events to log', eventsToLog)
    const tempEvents = {}
    eventList.forEach(validEvent => {
      if (global.bot.guildSettingsCache[guildID].event_logs[validEvent] && !eventsToLog.includes(validEvent)) {
        console.log(`${validEvent} not set anymore, clearing`)
        tempEvents[validEvent] = ''
      } else {
        console.log('inherit', validEvent)
        tempEvents[validEvent] = global.bot.guildSettingsCache[guildID].event_logs[validEvent]
      }
    })
    eventsToLog.forEach(eventToLog => {
      console.log('you said to log', eventToLog, 'to', logChannelID)
      tempEvents[eventToLog] = logChannelID
    })
    console.log('building done', tempEvents)
    await setEventsRawLogs(guildID, logChannelID, tempEvents)
    await guildWebhookCacher(guildID, logChannelID)
    const redoUUID = uuidv4()
    // await global.bot.requestHandler.request('PATCH', `/channels/${messageToEdit.channel.id}/messages/${messageToEdit.id}`, true)
    await messageToEdit.edit({
      embeds: [{
        title: 'Logger Configuration Successful',
        description: `Success! The selected presets will be logged to <#${logChannelID}>. This message will auto-delete after 1 minute.`,
        color: 0x05adb2
      }],
      components: [{
        type: 1,
        components: [
          {
            type: 2,
            label: 'Continue Configuring...',
            style: 1,
            custom_id: redoUUID
          }
        ]
      }]
    })
    console.log('uuid', redoUUID)
    /*
    {
          type: 1,
          components: [{
            type: 3,
            custom_id: redoUUID,
            min_values: 0,
            max_values: allPresetOptions.length,
            placeholder: 'Select presets to use...',
            options: await buildDefaultsPresetsOptions(guildID, logChannelID)
          }]
        }
        */
    awaitCustomID(redoUUID, authorID).then(() => {
      console.log('ok')
      renderPresetConfig(guildID, logChannelID, messageToEdit, authorID)
    }).catch(() => {
      messageToEdit.delete().catch(() => {})
    })
  } catch (_) {
    messageToEdit.delete().catch(() => {})
  }
}

function presetsToEvents (presets) {
  let tempEvents = []
  presets.forEach(preset => {
    if (PRESET_EVENT_MAP[preset]) {
      tempEvents = tempEvents.concat(PRESET_EVENT_MAP[preset])
    }
  })
  return tempEvents
}

function cleanEventsArray (events) {
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

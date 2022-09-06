const Eris = require('eris')
const { v4: uuidv4 } = require('uuid')
const { setEventsLogId } = require('../../db/interfaces/postgres/update')
const { EMBED_COLORS, PRESET_EVENT_MAP, ALL_EVENTS } = require('../utils/constants')
const { getEmbedFooter, getAuthorField } = require('../utils/embeds')

async function returnMissingPerms (channelID, userID, events) {
  const requiredPerms = ['manageWebhooks', 'viewAuditLog', 'viewChannel', 'sendMessages', 'embedLinks', 'readMessageHistory', 'useExternalEmojis']
  let logChannelPerms
  try {
    const logChannel = global.bot.getChannel(channelID)
    logChannelPerms = logChannel.permissionsOf(userID)?.json
  } catch (_) {
    // missing channel
    return
  }
  return requiredPerms.filter(rp => !logChannelPerms[rp])
}

async function handlePresetSetup (interaction, recursionUUID) {
  const { awaitCustomID } = require('../events/interactionCreate')
  const guildEvents = global.bot.guildSettingsCache[interaction.guildID].getEventLogRaw()
  const followupUUID = recursionUUID || uuidv4()
  try {
    const components = [{
      type: Eris.Constants.ComponentTypes.ACTION_ROW,
      components: [{
        type: Eris.Constants.ComponentTypes.SELECT_MENU,
        custom_id: followupUUID,
        max_values: 9,
        min_values: 0,
        options: [{
          label: 'ALL',
          description: 'Log ALL events',
          value: 'all',
          default: !Object.keys(guildEvents).find(geKey => guildEvents[geKey] !== interaction.channel.id)
        }, {
          label: 'Channel Events',
          description: 'Channel created, deleted, updated (name, permission overwrites)',
          value: 'channel',
          default: interaction.channel.id === guildEvents.channelCreate && interaction.channel.id === guildEvents.channelUpdate && interaction.channel.id === guildEvents.channelDelete
        }, {
          label: 'Message Events',
          description: 'Message update, delete, and bulk delete (ban, purge)',
          value: 'message',
          default: interaction.channel.id === guildEvents.messageUpdate && interaction.channel.id === guildEvents.messageDelete && interaction.channel.id === guildEvents.messageDeleteBulk
        }, {
          label: 'Member Update Events',
          description: 'Member role added/removed, nickname changed, boosted server, timed out',
          value: 'member',
          default: interaction.channel.id === guildEvents.guildMemberUpdate && interaction.channel.id === guildEvents.guildMemberBoostUpdate && interaction.channel.id === guildEvents.guildMemberNickUpdate
        }, {
          label: 'Moderation Events',
          description: 'Member banned/unbanned or kicked',
          value: 'moderation',
          default: interaction.channel.id === guildEvents.guildBanAdd && interaction.channel.id === guildEvents.guildBanRemove && interaction.channel.id === guildEvents.guildMemberKick
        }, {
          label: 'Joinlog Events',
          description: '(Requires manage server & manage channels to be accurate) member join/leave',
          value: 'joinlog',
          default: interaction.channel.id === guildEvents.guildMemberAdd && interaction.channel.id === guildEvents.guildMemberRemove
        }, {
          label: 'Server Events',
          description: 'Server settings update (name, moderation level, ...), event started',
          value: 'server',
          default: interaction.channel.id === guildEvents.guildUpdate
        }, {
          label: 'Role Events',
          description: 'Role created/deleted/updated (name, permissions)',
          value: 'role',
          default: interaction.channel.id === guildEvents.guildRoleCreate && interaction.channel.id === guildEvents.guildRoleDelete && interaction.channel.id === guildEvents.guildRoleUpdate
        }, {
          label: 'Voice Events',
          description: 'Voice channel join/leave/switch, server muted/deafened',
          value: 'voice',
          default: interaction.channel.id === guildEvents.voiceChannelLeave && interaction.channel.id === guildEvents.voiceChannelSwitch && interaction.channel.id === guildEvents.voiceStateUpdate && interaction.channel.id === guildEvents.voiceChannelJoin
        }]
      }]
    }]
    const setupEmbed = {
      title: 'Welcome to the Logger setup utility',
      description: 'Use the option selector below choose preset events for logging to **here**. If you want to learn more about the usage of this command, see `/help guide: Usage` and `/help`.',
      color: EMBED_COLORS.PURPLED_BLUE,
      thumbnail: {
        url: interaction.member.user.dynamicAvatarURL(null, 64)
      }
    }
    if (recursionUUID) {
      await interaction.editOriginalMessage({ embeds: [setupEmbed], flags: Eris.Constants.MessageFlags.EPHEMERAL, components })
    } else {
      await interaction.createMessage({ embeds: [setupEmbed], flags: Eris.Constants.MessageFlags.EPHEMERAL, components })
    }
  } catch (e) {
    global.logger.error('error handling preset menu', e)
    return
  }

  let buttonResponse

  try {
    buttonResponse = await awaitCustomID(followupUUID, interaction.member.user.id)
  } catch (_) {
    return
  }

  let eventsToLog = []
  let eventsToRemove = []

  for (const presetName in PRESET_EVENT_MAP) {
    for (const eventName of PRESET_EVENT_MAP[presetName]) {
      if (buttonResponse.data.values?.includes(presetName)) {
        if (presetName === 'all') {
          eventsToLog = ALL_EVENTS
          eventsToRemove = []
          break
        } else {
          eventsToLog.push(eventName)
        }
      } else if (guildEvents[eventName] === interaction.channel.id && presetName !== 'all') {
        eventsToRemove.push(eventName)
      }
    }
  }

  const missingPermissions = await returnMissingPerms(interaction.channel.id, global.bot.user.id, eventsToLog)
  if (!missingPermissions) return // null is returned if the log channel cannot be found
  else if (missingPermissions.length !== 0) {
    await interaction.editOriginalMessage({
      embeds: [{
        thumbnail: {
          url: global.bot.user.dynamicAvatarURL(null, 64)
        },
        description: `I cannot update logging settings with new presets: I need the following permissions in this channel: ${missingPermissions.map(p => `**${p}**`).join(', ')}. Have questions? See \`/help usage: Guide\``,
        color: EMBED_COLORS.YELLOW_ORANGE,
        footer: getEmbedFooter(global.bot.user),
        author: getAuthorField(interaction.member.user)
      }],
      flags: Eris.Constants.MessageFlags.EPHEMERAL
    })
    return
  }

  try {
    await setEventsLogId(interaction.guildID, interaction.channel.id, eventsToLog)
    await setEventsLogId(interaction.guildID, '', eventsToRemove)
  } catch (e) {
    global.logger.error('Setup failure to update guild document settings for guild', interaction.guildID, e)
    return
  }
  handlePresetSetup(interaction, followupUUID)
}

async function handleIndividualSetup (interaction, recursionUUID) {
  const { awaitCustomID } = require('../events/interactionCreate')
  const guildEvents = global.bot.guildSettingsCache[interaction.guildID].getEventLogRaw()
  const followupUUID = recursionUUID || uuidv4()
  try {
    const components = [{
      type: Eris.Constants.ComponentTypes.ACTION_ROW,
      components: [{
        type: Eris.Constants.ComponentTypes.SELECT_MENU,
        custom_id: followupUUID,
        max_values: 24,
        min_values: 0,
        options: [{
          label: 'ALL',
          description: 'Log ALL events',
          value: 'all',
          default: !Object.keys(guildEvents).find(geKey => guildEvents[geKey] !== interaction.channel.id)
        },
        {
          label: 'Channel Create',
          description: 'On channel creation',
          value: 'channelCreate',
          default: guildEvents
            .channelCreate ===
            interaction.channel.id
        },
        {
          label: 'Channel Update',
          description: 'On channel settings change',
          value: 'channelUpdate',
          default: guildEvents
            .channelUpdate ===
            interaction.channel.id
        },
        {
          label: 'Channel Delete',
          description: 'On channel deletion',
          value: 'channelDelete',
          default: guildEvents
            .channelDelete ===
            interaction.channel.id
        },
        {
          label: 'Member Banned',
          description: 'On member being banned',
          value: 'guildBanAdd',
          default: guildEvents
            .guildBanAdd ===
            interaction.channel.id
        },
        {
          label: 'Member Unbanned',
          description: 'On member being unbanned',
          value: 'guildBanRemove',
          default: guildEvents
            .guildBanRemove ===
            interaction.channel.id
        },
        {
          label: 'Role Create',
          description: 'On role creation',
          value: 'guildRoleCreate',
          default: guildEvents
            .guildRoleCreate ===
            interaction.channel.id
        },
        {
          label: 'Role Delete',
          description: 'On role deletion',
          value: 'guildRoleDelete',
          default: guildEvents
            .guildRoleDelete ===
            interaction.channel.id
        },
        {
          label: 'Role Update',
          description: 'On role update',
          value: 'guildRoleUpdate',
          default: guildEvents
            .guildRoleUpdate ===
            interaction.channel.id
        },
        {
          label: 'Server Settings Change',
          description:
            'On server settings being changed',

          value: 'guildUpdate',
          default: guildEvents
            .guildUpdate ===
            interaction.channel.id
        },
        {
          label: 'Server Emojis Change',
          description:
            'On emojis being added or removed',
          value: 'guildEmojisUpdate',
          default: guildEvents
            .guildEmojisUpdate ===
            interaction.channel.id
        },
        {
          label: 'Message Delete',
          description:
            'On a single message being deleted',

          value: 'messageDelete',
          default: guildEvents
            .messageDelete ===
            interaction.channel.id
        },
        {
          label: 'Bulk Message Delete',
          description:
            'On a message purge or member ban',
          value: 'messageDeleteBulk',
          default: guildEvents
            .messageDeleteBulk ===
            interaction.channel.id
        },
        {
          label: 'Message Edit',
          description: 'On message update',
          value: 'messageUpdate',
          default: guildEvents
            .messageUpdate ===
            interaction.channel.id
        },
        {
          label: 'Member Join',
          description:
            'On member joining the server',
          value: 'guildMemberAdd',
          default: guildEvents
            .guildMemberAdd ===
            interaction.channel.id
        },
        {
          label: 'Member Kick',
          description: 'On member being kicked',
          value: 'guildMemberKick',
          default: guildEvents
            .guildMemberKick ===
            interaction.channel.id
        },
        {
          label: 'Member Leave',
          description:
            'On member leaving the server',
          value: 'guildMemberRemove',
          default: guildEvents
            .guildMemberRemove ===
            interaction.channel.id
        },
        {
          label: 'Member Nickname Update',
          description:
            'On member updating their nickname (conditional log!)',
          value: 'guildMemberNickUpdate',
          default: guildEvents
            .guildMemberNickUpdate ===
            interaction.channel.id
        },
        {
          label: 'Member Role Add/Remove',
          description:
            'On member getting or losing a role',
          value: 'guildMemberUpdate',
          default: guildEvents
            .guildMemberUpdate ===
            interaction.channel.id
        },
        {
          label: 'Member Gate Verify',
          description:
            'On member accepting community rules',
          value: 'guildMemberVerify',
          default: guildEvents
            .guildMemberVerify ===
            interaction.channel.id
        },
        {
          label: 'Voice Channel Leave',
          description:
            'On member leaving a voice channel',
          value: 'voiceChannelLeave',
          default: guildEvents
            .voiceChannelLeave ===
            interaction.channel.id
        },
        {
          label: 'Voice Channel Join',
          description:
            'On member joining a voice channel',
          value: 'voiceChannelJoin',
          default: guildEvents.voiceChannelJoin ===
            interaction.channel.id
        },
        {
          label: 'Voice Channel Moved',
          description:
            'On member getting moved from a voice channel',
          value: 'voiceChannelSwitch',
          default: guildEvents.voiceChannelSwitch ===
            interaction.channel.id
        },
        {
          label: 'Member Voice Muted/Deafened',
          description:
            'On member being muted or deafened',
          value: 'voiceStateUpdate',
          default: guildEvents.voiceStateUpdate === interaction.channel.id
        }
        ]
      }]
    }]
    const setupEmbed = {
      title: 'Welcome to the Logger setup utility',
      description: 'Use the option selector below choose individual events for logging to **here**. If you want to learn more about the usage of this command, see `/help guide: Usage` and `/help`.',
      color: EMBED_COLORS.PURPLED_BLUE,
      thumbnail: {
        url: interaction.member.user.dynamicAvatarURL(null, 64)
      }
    }
    if (recursionUUID) {
      await interaction.editOriginalMessage({ embeds: [setupEmbed], flags: Eris.Constants.MessageFlags.EPHEMERAL, components })
    } else {
      await interaction.createMessage({ embeds: [setupEmbed], flags: Eris.Constants.MessageFlags.EPHEMERAL, components })
    }
  } catch (e) {
    global.logger.error('Error handling preset menu', e)
    return
  }

  let buttonResponse

  try {
    buttonResponse = await awaitCustomID(followupUUID, interaction.member.user.id)
  } catch (_) {
    return
  }

  let eventsToLog = []
  let eventsToRemove = []

  if (buttonResponse.data.values?.includes('all')) {
    eventsToLog = ALL_EVENTS
    eventsToRemove = []
  } else {
    for (const eventName of ALL_EVENTS) {
      if (buttonResponse.data.values?.includes(eventName)) {
        eventsToLog.push(eventName)
      } else if (guildEvents[eventName] === interaction.channel.id) {
        eventsToRemove.push(eventName)
      }
    }
  }

  const missingPermissions = await returnMissingPerms(interaction.channel.id, global.bot.user.id, eventsToLog)
  if (!missingPermissions) return // null is returned if the log channel cannot be found
  else if (missingPermissions.length !== 0) {
    await interaction.editOriginalMessage({
      embeds: [{
        thumbnail: {
          url: global.bot.user.dynamicAvatarURL(null, 64)
        },
        description: `I cannot update logging settings with new presets: I need the following permissions in this channel: ${missingPermissions.map(p => `**${p}**`).join(', ')}. Have questions? See \`/help usage: Guide\``,
        color: EMBED_COLORS.YELLOW_ORANGE,
        footer: getEmbedFooter(global.bot.user),
        author: getAuthorField(interaction.member.user)
      }],
      flags: Eris.Constants.MessageFlags.EPHEMERAL
    })
    return
  }

  try {
    await setEventsLogId(interaction.guildID, interaction.channel.id, eventsToLog)
    await setEventsLogId(interaction.guildID, '', eventsToRemove)
  } catch (e) {
    global.logger.error('Setup failure to update guild document settings for guild', interaction.guildID, e)
    return
  }
  handleIndividualSetup(interaction, followupUUID)
}

async function handleListLogSetup (interaction) {
  const logLines = []
  for (const eventName of ALL_EVENTS) {
    if (global.bot.guildSettingsCache[interaction.guildID].getEventLogID(eventName)) {
      const logIdForEvent = global.bot.guildSettingsCache[interaction.guildID].getEventLogID(eventName)
      logLines.push(`${eventName}: <#${logIdForEvent}> (${logIdForEvent})`)
    }
  }
  interaction.createMessage({
    embeds: [{
      title: 'Logging Channels',
      author: getAuthorField(interaction.member.user),
      description: logLines.length !== 0 ? logLines.join('\n') : 'I am not logging any events to this server, see `/setup` or `/help` for setup help.',
      color: EMBED_COLORS.PURPLED_BLUE
    }],
    flags: Eris.Constants.MessageFlags.EPHEMERAL
  }).catch(() => {})
}

module.exports = {
  name: 'setup',
  userPerms: ['manageWebhooks', 'manageChannels', 'viewAuditLogs'],
  botPerms: ['manageWebhooks', 'viewAuditLogs'],
  noThread: true,
  func: async interaction => {
    if (interaction.data.options?.find(o => o.name === 'via_presets')) {
      await handlePresetSetup(interaction)
    } else if (interaction.data.options?.find(o => o.name === 'via_individual_event')) {
      await handleIndividualSetup(interaction)
    } else if (interaction.data.options?.find(o => o.name === 'list')) {
      await handleListLogSetup(interaction)
    }
  }
}

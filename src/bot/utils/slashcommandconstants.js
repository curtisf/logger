const ERIS_CONSTANTS = require('eris').Constants

exports.commands = [
  {
    name: 'ping',
    description: 'Is the bot still alive? Find out using this!'
  },
  {
    name: 'serverinfo',
    description: 'Shows you information about the server (role count, member count, features)'
  },
  {
    name: 'setup',
    description: 'Start setting Logger up',
    options: [
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'via_presets',
        description: 'Use this option to enable multiple events at once (joinlog, role, channel, etc)'
      },
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'via_individual_event',
        description: 'Use this option to enable events one-by-one, for finer control'
      },
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.SUB_COMMAND,
        name: 'list',
        description: 'Use this option to list channels used for logging (and /stoplogging to stop them)'
      }
    ]
  },
  {
    name: 'archive',
    description: 'Creates a paste entry with this number of channel messages (auto-deletes in 2 weeks)',
    options: [
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.INTEGER,
        name: 'amount',
        description: 'The number of messages to create a paste entry with (must be >= 5 or <= 100, 10,000 for patreon bot)',
        required: true,
        autocomplete: true,
        max_value: 100,
        min_value: 5
      }
    ]
  },
  {
    name: 'userinfo',
    description: 'See information about you (joined at, creation date, roles)',
    options: [
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.USER,
        name: 'user',
        description: 'If the bot knows the given user, it presents info for them'
      }
    ]
  },
  {
    name: 'clearmydata',
    description: 'Get information about how to clear your data'
  },
  {
    name: 'ignorechannel',
    description: 'Toggles logging most events from the channel you choose',
    options: [
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.CHANNEL,
        name: 'channel-to-ignore',
        description: 'The channel to toggle ignoring',
        channel_types: [0, 2, 4] // text, voice, category
      },
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
        name: 'optional',
        description: 'Select to see other ignorechannel options',
        choices: [
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'list ignored channels',
            value: 'list'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'reset ignored channels',
            value: 'reset'
          }
        ]
      }
    ]
  },
  {
    name: 'stoplogging',
    description: 'Turns off bot logging in the specified channel (or everything)',
    options: [
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.CHANNEL,
        name: 'channel',
        description: 'Stop logging any events in the given channel',
        channel_types: [0, 2, 4] // text, voice, category
      },
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
        name: 'other',
        description: 'Other stoplogging options',
        choices: [
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'stop logging anything anywhere (everything)',
            value: 'everything'
          }
        ]
      }
    ]
  },
  {
    name: 'invite',
    description: 'Receive an embed with customized invite links for your logging purpose'
  },
  {
    name: 'logbots',
    description: 'Toggle whether I log other bot actions (DEFAULT: disabled). Does NOT ignore bots deleting messages!'
  },
  {
    name: 'help',
    description: 'Use to get general bot help (support server, technology)',
    options: [
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
        name: 'event',
        description: 'Get information about a given command',
        choices: [
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Channel Create',
            value: 'channelCreate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Channel Update',
            value: 'channelUpdate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Channel Delete',
            value: 'channelDelete'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Banned',
            value: 'guildBanAdd'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Unbanned',
            value: 'guildBanRemove'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Role Create',
            value: 'guildRoleCreate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Role Delete',
            value: 'guildRoleDelete'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Role Update',
            value: 'guildRoleUpdate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Server Settings Change',
            value: 'guildUpdate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Server Emojis Change',
            value: 'guildEmojisUpdate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Message Delete',
            value: 'messageDelete'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Bulk Message Delete',
            value: 'messageDeleteBulk'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Message Edit',
            value: 'messageUpdate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Join',
            value: 'guildMemberAdd'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Kick',
            value: 'guildMemberKick'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Leave',
            value: 'guildMemberRemove'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Nickname Update',
            value: 'guildMemberNickUpdate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Role Add/Remove',
            value: 'guildMemberUpdate'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Gate Verify',
            value: 'guildMemberVerify'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Voice Channel Leave',
            value: 'voiceChannelLeave'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Voice Channel Join',
            value: 'voiceChannelJoin'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Voice Channel Moved',
            value: 'voiceChannelSwitch'
          },
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Member Voice Muted/Deafened',
            value: 'voiceStateUpdate'
          }
        ]
      },
      {
        type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
        name: 'guide',
        description: 'Get information on how to set the bot up',
        choices: [
          {
            type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
            name: 'Usage',
            value: 'usage'
          }
        ]
      }
    ]
  }
]

exports.developerCommands = [{
  name: 'setcmds',
  description: '[OWNER ONLY] set logger commands',
  options: [{
    type: ERIS_CONSTANTS.ApplicationCommandOptionTypes.STRING,
    name: 'scope',
    description: '[OWNER ONLY] scope of commands to set',
    choices: [{
      name: 'Guild',
      value: 'guild'
    }, {
      name: 'Global',
      value: 'global'
    }]
  }]
}, {
  name: 'reloadinteractions',
  description: '[OWNER ONLY] reload interaction handling logic'
}]
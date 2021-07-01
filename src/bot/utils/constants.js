exports.ALL_EVENTS = [
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
  'guildMemberNickUpdate',
  'guildMemberVerify',
  'voiceChannelLeave',
  'voiceChannelJoin',
  'voiceStateUpdate',
  'voiceChannelSwitch',
  'guildEmojisUpdate',
  'guildMemberBoostUpdate'
]

exports.EVENTS_USING_AUDITLOGS = [
  'channelCreate',
  'channelUpdate',
  'channelDelete',
  'guildBanAdd',
  'guildBanRemove',
  'guildRoleCreate',
  'guildRoleDelete',
  'guildRoleUpdate',
  'guildUpdate',
  'messageDeleteBulk',
  'guildMemberKick',
  'guildMemberRemove',
  'guildMemberUpdate',
  'voiceStateUpdate',
  'guildEmojisUpdate'
]

exports.PRESET_EVENT_MAP = {
  voice: ['voiceChannelLeave', 'voiceChannelJoin', 'voiceChannelSwitch'],
  messages: ['messageUpdate', 'messageDelete', 'messageDeleteBulk'],
  mod: ['guildBanAdd', 'guildBanRemove', 'guildMemberUpdate', 'guildMemberKick', 'guildMemberNickUpdate'],
  joinlog: ['guildMemberAdd', 'guildMemberRemove'],
  server: ['channelCreate', 'channelUpdate', 'channelDelete', 'guildRoleUpdate', 'guildRoleCreate', 'guildRoleDelete', 'guildUpdate']
}

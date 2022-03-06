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

exports.EMBED_COLORS = {
  RED: 0xbb2124,
  YELLOW_ORANGE: 0xffaf24,
  GREEN: 0x22bb33,
  PURPLED_BLUE: 0x3838fc,
  CLEAR: 0x36393f // clear for dark mode users
}

exports.PRESET_EVENT_MAP = {
  voice: ['voiceChannelLeave', 'voiceChannelJoin', 'voiceChannelSwitch', 'voiceStateUpdate'],
  message: ['messageUpdate', 'messageDelete', 'messageDeleteBulk'],
  member: ['guildMemberUpdate', 'guildMemberNickUpdate', 'guildMemberVerify', 'guildMemberBoostUpdate'],
  moderation: ['guildBanAdd', 'guildBanRemove', 'guildMemberKick'],
  joinlog: ['guildMemberAdd', 'guildMemberRemove'],
  server: ['guildUpdate'],
  role: ['guildRoleUpdate', 'guildRoleCreate', 'guildRoleDelete'],
  channel: ['channelCreate', 'channelUpdate', 'channelDelete'],
  all: this.ALL_EVENTS
}

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

exports.EVENT_HELP = {
  channelCreate: 'channelCreate is triggered when a text/voice/announcement/category/stage channel is created. It includes potential permission overwrites as well as the user who created the channel.',
  channelUpdate: 'channelUpdate is triggered when a text/voice/announcement/category/stage channel is updated. Potential logged changes are overwrite created/updated/deleted, bitrate, slowmode, and topic. The user who updated the channel and the reason (if any) are included.',
  channelDelete: 'channelDelete is triggered when a text/voice/announcement/category/stage channel is deleted. It includes potential permission overwrites, the user who deleted the channel, and the reason (if any).',
  guildBanAdd: 'guildBanAdd is triggered when a member is banned from the server. It includes the action taker and the reason why (if any).',
  guildBanRemove: 'guildBanRemove is triggered when a member is unbanned from the server. It includes the action taker and the reason why (if any).',
  guildRoleCreate: 'guildRoleCreate is triggered when a user creates a role. The role creator, name, color, mentionability, hoist, and permissions are included.',
  guildRoleDelete: 'guildRoleDelete is triggered when a user deletes a role. The user who deleted the role, name, color, mentionability, hoist, and permissions are included.',
  guildRoleUpdate: 'guildRoleUpdate is triggered when a user changes the properties of a role. The user who updated the role, name, icon, color, mentionability, hoist, and permission overwrites are included.',
  guildUpdate: 'guildUpdate is triggered when the server has it\'s settings updated. Supported updates are content filter, nsfw level, afk channel settings, banner, notification level, description, icon, two factor, locale, rules channel, official messages channel, and vanity code. The user who updated the server is included.',
  messageDelete: 'messageDelete is triggered when a member deletes their message or a bot deletes a message. By default, messages created by bots that are deleted are not logged to prevent spam (use /logbots to enable). The user who deleted the message is NOT included (not fetched to prevent hitting my global ratelimit).',
  messageDeleteBulk: 'messageDeleteBulk is triggered when a bot mass deletes messages or a user is banned and their messages are deleted. If known, the messages are collected into an archive and the link to view is included.',
  messageUpdate: 'messageUpdate is triggered when a member edits their message. A link to jump to the edited message is included. Message edits by bots are NOT included (prevent spam).',
  guildMemberAdd: 'guildMemberAdd is triggered when a user joins the server. It includes the user\'s creation date, invite used, and server member count.',
  guildMemberKick: 'guildMemberKick is triggered when a member is kicked from the server. The user who performed the kick and the reason (if any) is included.',
  guildMemberRemove: 'guildMemberRemove is triggered when a member leaves the server. If the user who left was kicked, guildMemberKick is triggered instead of guildMemberRemove.',
  guildMemberUpdate: 'guildMemberUpdate is triggered when a member has a role added/removed or they are timed out. The user who performed the role add/remove/timeout and the reason (if any) are included.',
  guildMemberNickUpdate: 'guildMemberNickUpdate is triggered when a member changes or has their nickname changed. Note: this will not log ALL member nickname changes, only those the bot knows first! (ie: the bot saw them make a message)',
  guildMemberVerify: 'guildMemberVerify is triggered when a member accepts the server-provided membership screen.',
  voiceChannelLeave: 'voiceChannelLeave is triggered when a member leaves a voice channel. If there was a member who performed a forceful voice disconnect, the member is NOT included.',
  voiceChannelJoin: 'voiceChannelJoin is triggered when a member joins a voice channel.',
  voiceStateUpdate: 'voiceStateUpdate is triggered when a member is forcefully muted or deafened in a voice channel. The user who performed the mute/deafen is included.',
  voiceChannelSwitch: 'voiceChannelSwitch is triggered when a member leaves one voice channel and joins another. If there was a member who forcefully moved another member, the action performer is NOT included.',
  guildEmojisUpdate: 'guildEmojisUpdate is triggered when an emoji is added/updated/removed. It includes the affected emoji as well as user who added/updated/removed it.',
  guildMemberBoostUpdate: 'guildMemberBoostUpdate is triggered when a member boosts or stops boosting the server.'
}

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

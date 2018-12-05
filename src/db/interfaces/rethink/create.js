const r = require('../../clients/rethink')

async function createGuild (guild) {
  return await r.db('Logger').table('Guilds').insert({
    'id': guild.id,
    'ignoredChannels': [],
    'disabledEvents': ['voiceChannelJoin', 'voiceChannelLeave', 'voiceChannelSwitch', 'guildEmojisUpdate'],
    'logchannel': '',
    'ownerID': guild.ownerID,
    'overviewID': '',
    'logBots': false,
    'eventLogs': {
      'channelCreate': '',
      'channelDelete': '',
      'channelUpdate': '',
      'guildBanAdd': '',
      'guildBanRemove': '',
      'guildEmojisUpdate': '',
      'guildMemberAdd': '',
      'guildMemberKick': '',
      'guildMemberRemove': '',
      'guildMemberUpdate': '',
      'guildRoleCreate': '',
      'guildRoleDelete': '',
      'guildRoleUpdate': '',
      'guildUpdate': '',
      'messageDelete': '',
      'messageDeleteBulk': '',
      'messageReactionRemoveAll': '',
      'messageUpdate': '',
      'voiceChannelJoin': '',
      'voiceChannelLeave': '',
      'voiceChannelSwitch': '',
      'voiceStateUpdate': ''
    },
    'prefixes': [],
    'premium': false
  }).run()
}

exports.createGuild = createGuild

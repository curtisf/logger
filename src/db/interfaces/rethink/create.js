const r = require('../../clients/rethink')

async function createGuild (guild) {
  return await r.db('Logger').table('Guilds').insert({
    'id': guild.id,
    'ignoredChannels': [],
    'disabledEvents': ['voiceChannelJoin', 'voiceChannelLeave', 'voiceChannelSwitch', 'guildEmojisUpdate'],
    'ownerID': guild.ownerID,
    'logBots': false,
    'eventLogs': {
      'channelCreate': '',
      'channelDelete': '',
      'channelUpdate': '',
      'guildBanAdd': '',
      'guildBanRemove': '',
      'guildEmojisUpdate': '',
      'guildMemberAdd': '',
      'guildMemberKick': '', // NOT an event, but something we will manually fire
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
    'premium': false,
    'ignoredUsers': []
  }).run()
}

async function createUserDocument (userID) {
  return await r.db('Logger').table('Users').insert({ 'id': userID, 'names': [], 'ignored': false }).run() // Yes, an ignored flag exists. This will not be granted to anyone unless they ask very nicely. Or if you're selfhosting and want to be immune from logging :) TODO: actually implement this functionality
}

exports.createUserDocument = createUserDocument
exports.createGuild = createGuild

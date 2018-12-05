const r = require('../../clients/rethink')

async function clearEventLog (guildID) {
  return await r.db('Logger').table('Guilds').get(guildID).update({
    'eventLogs': {
      'channelCreate': '',
      'channelUpdate': '',
      'channelDelete': '',
      'guildBanAdd': '',
      'guildBanRemove': '',
      'guildRoleCreate': '',
      'guildRoleDelete': '',
      'guildRoleUpdate': '',
      'guildUpdate': '',
      'messageDelete': '',
      'messageDeleteBulk': '',
      'messageReactionRemoveAll': '',
      'messageUpdate': '',
      'guildMemberAdd': '',
      'guildMemberKick': '',
      'guildMemberRemove': '',
      'guildMemberUpdate': '',
      'voiceChannelLeave': '',
      'voiceChannelJoin': '',
      'voiceStateUpdate': '',
      'voiceChannelSwitch': '',
      'guildEmojisUpdate': ''
    }
  }).run()
}

async function clearEventByID (guildID, channelID) {
  let doc = await r.db('Logger').table('Guilds').get(guildID).run()
  Object.keys(doc.eventLogs).forEach((event) => {
    if (doc.eventLogs[event] === channelID) {
      doc.eventLogs[event] = ''
    }
  })
}

exports.clearEventLog = clearEventLog
exports.clearEventByID = clearEventByID

const r = require('../../clients/rethink')
const getDoc = require('./read').getGuild

function clearEventLog (guildID) {
  return r.db('Logger').table('Guilds').get(guildID).update({
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
  const doc = await r.db('Logger').table('Guilds').get(guildID).run()
  Object.keys(doc.eventLogs).forEach(event => {
    if (doc.eventLogs[event] === channelID) {
      doc.eventLogs[event] = ''
    }
  })
  return r.db('Logger').table('Guilds').get(guildID).update(doc).run()
}

async function disableEvent (guildID, event) {
  const doc = await getDoc(guildID)
  let disabled = true
  if (doc.disabledEvents.includes(event)) {
    doc.disabledEvents.splice(doc.disabledEvents.indexOf(event), 1)
    disabled = false
  } else {
    doc.disabledEvents.push(event)
  }
  await r.db('Logger').table('Guilds').get(guildID).update({
    'disabledEvents': doc.disabledEvents
  }).run()
  return disabled
}

async function ignoreChannel (guildID, channelID) {
  const doc = await getDoc(guildID)
  let disabled = true
  if (doc.ignoredChannels.includes(channelID)) {
    doc.ignoredChannels.splice(doc.ignoredChannels.indexOf(channelID), 1)
    disabled = false
  } else {
    doc.ignoredChannels.push(channelID)
  }
  await r.db('Logger').table('Guilds').get(guildID).update({
    'ignoredChannels': doc.ignoredChannels
  }).run()
  return disabled
}

async function toggleLogBots (guildID) {
  const doc = await getDoc(guildID)
  await r.db('Logger').table('Guilds').get(guildID).update({
    'logBots': !doc.logBots
  }).run()
  return !doc.logBots
}

exports.toggleLogBots = toggleLogBots
exports.disableEvent = disableEvent
exports.ignoreChannel = ignoreChannel
exports.clearEventLog = clearEventLog
exports.clearEventByID = clearEventByID

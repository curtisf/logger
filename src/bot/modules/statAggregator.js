// This file exists to aggregate command, event, & other miscellaneous statistics to send to Zabbix.

const guildActivity = new Map()

const commandStatistics = {
  archive: 0,
  clearmydata: 0,
  stoplogging: 0,
  help: 0,
  ignorechannel: 0,
  info: 0,
  invite: 0,
  logbots: 0,
  ping: 0,
  reset: 0,
  serverinfo: 0,
  setchannel: 0,
  togglemodule: 0,
  userinfo: 0,
  setup: 0
}

const eventStatistics = {
  channelCreate: 0,
  channelDelete: 0,
  channelUpdate: 0,
  guildBanAdd: 0,
  guildBanRemove: 0,
  guildCreate: 0,
  guildDelete: 0,
  guildEmojisUpdate: 0,
  guildStickersUpdate: 0,
  guildMemberAdd: 0,
  guildMemberKick: 0,
  guildMemberRemove: 0,
  guildMemberUpdate: 0,
  guildMemberNickUpdate: 0,
  guildMemberVerify: 0,
  guildRoleCreate: 0,
  guildRoleDelete: 0,
  guildRoleUpdate: 0,
  guildUpdate: 0,
  messageDelete: 0,
  messageDeleteBulk: 0,
  messageUpdate: 0,
  voiceChannelJoin: 0,
  voiceChannelLeave: 0,
  voiceChannelSwitch: 0,
  voiceStateUpdate: 0,
  'rest-timeout': 0,
  'rest-request': 0,
  webhookSends: 0,
  nonWebhookSends: 0,
  'rest-hit': 0,
  'global-ratelimit-hit': 0,
  'ratelimit-hit': 0,
  'webhook-ratelimit-hit': 0,
  guildMemberBoostUpdate: 0
}

const miscStatistics = {
  redisGet: 0,
  redisSet: 0,
  fetchWebhooks: 0,
  fetchAuditLogs: 0,
  ready: 0,
  disconnect: 0,
  createWebhook: 0
}

module.exports = {
  incrementCommand (command) {
    if (!commandStatistics.hasOwnProperty(command)) {
      console.error(`${command} is not a valid command to increment the statistics of!`)
      return
    }
    commandStatistics[command]++
  },
  incrementEvent (event) {
    if (!eventStatistics.hasOwnProperty(event)) {
      console.error(`${event} is not a valid event to increment the statistics of!`)
      return
    }
    eventStatistics[event]++
  },
  incrementMisc (miscItem) {
    if (!miscStatistics.hasOwnProperty(miscItem)) {
      console.error(`${miscItem} is not a valid item to increment the statistics of!`)
      return
    }
    miscStatistics[miscItem]++
  },
  incrementRedisGet () {
    miscStatistics.redisGet++
  },
  incrementRedisSet () {
    miscStatistics.redisSet++
  },
  incrementGuild (guildID) {
    if (guildActivity.has(guildID)) guildActivity.set(guildID, guildActivity.get(guildID) + 1)
    else guildActivity.set(guildID, 1)
  },
  getMostActiveGuilds () {
    return [...guildActivity.entries()].sort((e1, e2) => e2[1] - e1[1])
  },
  clearGuildActivity () {
    guildActivity.clear()
  }
}

function sendStatsIPC () {
  let allEventAggregate = 0
  Object.keys(eventStatistics).forEach(k => {
    allEventAggregate += eventStatistics[k]
  })
  if (allEventAggregate > 0) {
    process.send({
      type: 'stats',
      commandUsage: commandStatistics,
      eventUsage: eventStatistics,
      miscUsage: miscStatistics
    })
    Object.keys(commandStatistics).forEach(k => {
      commandStatistics[k] = 0
    })
    Object.keys(eventStatistics).forEach(k => {
      eventStatistics[k] = 0
    })
    Object.keys(miscStatistics).forEach(k => {
      miscStatistics[k] = 0
    })
  }
}

process.on('message', m => {
  if (m && m.type === 'sendStats') {
    sendStatsIPC()
  }
})

let webhookHitCount = 0
let lastWebhookTs = Date.now()

global.bot.on('rawREST', r => {
  if (!r || !r.url) return
  module.exports.incrementEvent('rest-hit')
  if (r.url.endsWith('audit-logs')) {
    module.exports.incrementMisc('fetchAuditLogs')
  }
  if (r.url.includes('webhooks')) {
    webhookHitCount++
    module.exports.incrementEvent('webhookSends')
    if (Date.now() - lastWebhookTs > 5000 && webhookHitCount > 1000) { // 1000 webhook sends in 5 seconds is a lot
      global.logger.warn('Webhook activity heuristic', r.url, r.body)
      if (webhookHitCount >= 2000) { // dump the flooding requests for some time
        webhookHitCount = 0
      }
    } else if (Date.now() - lastWebhookTs > 5000) {
      lastWebhookTs = Date.now()
      webhookHitCount = 0
    }
  } else {
    module.exports.incrementEvent('nonWebhookSends')
  }
})

module.exports.sendStatsIPC = sendStatsIPC

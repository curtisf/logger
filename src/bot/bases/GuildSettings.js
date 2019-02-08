const cacheGuild = require('../utils/cacheGuild')

class GuildSettings {
  constructor (data) {
    if (data.disabled) return
    if (!data.ownerID && !data.owner_id) {
      global.logger.info(JSON.stringify(data))
      global.logger.fatal('A guild settings doc is missing an ownerID!', data)
    }
    this.id = data.id
    this.ignoredChannels = data.ignoredChannels || data.ignored_channels
    this.logBots = data.logBots || data.log_bots
    this.eventLogs = data.eventLogs // TODO: make a guild doc transformer that converts old docs to new
    this.allLog = data.logchannel
    this.ownerID = data.ownerID || data.owner_id
    this.disabledEvents = data.disabledEvents || data.disabled_events
    this.feeds = data.feeds ? data.feeds : ''
    this.joinlog = this.feeds ? this.feeds.joinlog.channelID : ''
    this.mod = data.feeds ? data.feeds.mod.channelID : ''
    this.messageLog = data.feeds ? data.feeds.messages.channelID : ''
    this.serverLog = data.feeds ? data.feeds.server.channelID : ''
    this.voice = data.feeds ? data.feeds.voice.channelID : ''
    this.premium = data.premium ? data.premium : false
    this.ignoredUsers = data.ignoredUsers

    global.bot.guildSettingsCache[data.id] = this
  }

  getEventLogID (eventName) {
    return this.eventLogs[eventName]
  }

  isPremium () {
    return this.premium
  }

  isUserIgnored (userID) {
    return this.ignoredUsers.includes(userID)
  }

  getID () {
    return this.id
  }

  getOwnerID () {
    return this.ownerID
  }

  getEventLogRaw () {
    return this.eventLogs
  }

  getEventByName (name) {
    return this.eventLogs[name]
  }

  getEventLogNames (channelID) {
    return Object.keys(this.eventLogs).filter(event => this.eventLogs[event] === channelID)
  }

  clearEventByID (id) {
    getEventLogNames(id).forEach(name => {
      this.eventLogs[name] = ''
    })
  }

  clearEventByName (name) {
    this.eventLogs[name] = ''
  }

  clearEventLog () {
    Object.keys(this.eventLogs).forEach(event => {
      this.eventLogs[event] = ''
    })
  }

  eventIsDisabled (event) {
    return this.disabledEvents.includes(event)
  }

  recache () {
    cacheGuild(this.id)
  }
}

module.exports = GuildSettings

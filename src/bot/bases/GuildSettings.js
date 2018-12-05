const cacheGuild = require('../utils/cacheGuild')

class GuildSettings {
  constructor (data) {
    if (data.disabled) return
    if (!data.ownerID) global.logger.fatal('A guild settings doc is missing an ownerID!', data)
    this.id = data.id
    this.ignoredChannels = data.ignoredChannels
    this.logBots = data.logBots
    this.eventLogs = data.eventLogs
    this.allLog = data.logchannel
    this.ownerID = data.ownerID
    this.disabledEvents = data.disabledEvents
    this.feeds = data.feeds
    this.joinlog = this.feeds.joinlog.channelID
    this.mod = data.feeds.mod.channelID
    this.messageLog = data.feeds.messages.channelID
    this.serverLog = data.feeds.server.channelID
    this.voice = data.feeds.voice.channelID
    this.premium = data.premium

    global.bot.guildSettingsCache[data.id] = this
  }

  getEventLogID (eventName) {
    return this.eventLogs[eventName]
  }

  isPremium () {
    return this.premium
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
    getEventLogNames(id).forEach((name) => {
      this.eventLogs[name] = ''
    })
  }

  clearEventByName (name) {
    this.eventLogs[name] = ''
  }

  clearEventLog () {
    Object.keys(this.eventLogs).forEach((event) => {
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

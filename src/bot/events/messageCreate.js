const commandHandler = require('../modules/commandhandler')
const cacheMessage = require('../../db/interfaces/postgres/create').cacheMessage
const cacheGuild = require('../utils/cacheGuild')

module.exports = {
  name: 'messageCreate',
  type: 'on',
  handle: async message => {
    if (message.type === 23 || message.type === 24 || message.author.bot || !message.member) return // do not log automod actions
    if (process.env.ENABLE_TEXT_COMMANDS) {
      await commandHandler(message)
    }
    if (message.author.id === global.bot.user.id) return // dump logs made by the bot
    const guildSettings = global.bot.guildSettingsCache[message.channel.guild.id]
    if (!guildSettings) await cacheGuild(message.channel.guild.id)
    if (!global.bot.guildSettingsCache[message.channel.guild.id].isChannelIgnored(message.channel.id)) {
      if (!global.bot.guildSettingsCache[message.channel.guild.id].isLogBots() && message.author.bot) return
      await cacheMessage(message)
    }
  }
}

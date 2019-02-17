const getGuildDocument = require('../../db/interfaces/postgres/read').getGuild

module.exports = async guildID => {
  const GuildSettings = require('../bases/GuildSettings')
  const doc = await getGuildDocument(guildID)
  global.bot.guildSettingsCache[guildID] = new GuildSettings(doc)
}

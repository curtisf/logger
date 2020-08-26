module.exports = async guildID => {
  const getGuildDocument = require('../../db/interfaces/sqlite').getGuild
  const GuildSettings = require('../bases/GuildSettings') // GuildSettings will NOT resolve if you require it outside of this function(?)
  const doc = await getGuildDocument(guildID)
  global.bot.guildSettingsCache[guildID] = new GuildSettings(doc)
}

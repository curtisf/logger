module.exports = async guildID => {
  const getGuildDocument = require('../../db/interfaces/postgres/read').getGuild
  const GuildSettings = require('../bases/GuildSettings') // this for some reason
  const doc = await getGuildDocument(guildID)
  global.bot.guildSettingsCache[guildID] = new GuildSettings(doc)
}

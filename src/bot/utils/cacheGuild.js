const getGuildDocument = require('../../db/interfaces/rethink/read')
const GuildSettings = require('../bases/GuildSettings')

module.exports = async guildID => {
  const doc = await getGuildDocument(guildID)
  global.bot.guildSettingsCache[guildID] = new GuildSettings(doc)
}

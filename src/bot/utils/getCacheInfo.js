const getAllGuilds = require('../../db/interfaces/rethink/read').getAllGuilds

module.exports = async () => {
  const allGuilds = await getAllGuilds()
  const ignoredChannels = []
  const guildPrefixes = {}
  allGuilds.forEach(guild => {
    if (guild.ignoredChannels.length !== 0) {
      ignoredChannels.concat(guild.ignoredChannels)
    }
    if (guild.prefixes.length !== 0 && guild.premium) {
      guildPrefixes[guild.id] = guild.prefixes
    }
  })
  return [ignoredChannels, guildPrefixes]
}

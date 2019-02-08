const getAllGuilds = require('../../db/interfaces/postgres/read').getAllGuilds

module.exports = async () => {
  const allGuilds = await getAllGuilds()
  const ignoredChannels = []
  const guildPrefixes = {}
  allGuilds.forEach(guild => {
    if (guild.ignored_channels.length !== 0) {
      ignoredChannels.concat(guild.ignored_hannels)
    }
    // if (guild.prefixes.length !== 0 && guild.premium) {
    //   guildPrefixes[guild.id] = guild.prefixes
    // } patreon bot sometime later
  })
  return [ignoredChannels, guildPrefixes]
}

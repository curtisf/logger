const getAllGuilds = require('../../db/interfaces/rethink/read').getAllGuilds
const GuildSettings = require('../bases/GuildSettings')

module.exports = async () => {
  const allGuilds = await getAllGuilds()
  allGuilds.forEach(guild => {
    new GuildSettings(guild)
  })
}

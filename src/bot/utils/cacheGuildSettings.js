const getAllGuilds = require('../../db/interfaces/rethink/read').getAllGuilds
const GuildSettings = require('../bases/GuildSettings')

module.exports = async () => {
  let allGuilds = await getAllGuilds()
  allGuilds.forEach((guild) => {
    new GuildSettings(guild)
  })
}

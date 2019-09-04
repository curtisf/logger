const getAllDBGuilds = require('../../db/interfaces/postgres/read').getAllGuilds
const createGuild = require('../../db/interfaces/postgres/create').createGuild

module.exports = async () => { // If the bot sees a guild that the DB doesn't know, create a record for it
  const allGuilds = await getAllDBGuilds()
  global.bot.guilds.forEach(async guild => {
    if (!allGuilds.find(g => g.id === guild.id)) {
      await createGuild(guild)
    }
  })
  global.logger.info('Found no missing guild documents.')
}

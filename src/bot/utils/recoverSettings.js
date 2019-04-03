const getAllDBGuilds = require('../../db/interfaces/postgres/read').getAllGuilds
const createGuild = require('../../db/interfaces/postgres/create').createGuild

module.exports = async () => { // the name of this file is a bit vague. if you have a better idea, let me know
  const allGuilds = await getAllDBGuilds()
  global.bot.guilds.forEach(async guild => {
    if (!allGuilds.find(g => g.id === guild.id)) {
      await createGuild(guild)
    }
  })
  global.logger.info('Found no missing guild documents.')
}

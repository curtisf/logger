const createGuild = require('../../db/interfaces/postgres/create').createGuild
const cacheGuild = require('../utils/cacheGuild')

module.exports = {
  name: 'guildCreate',
  type: 'on',
  handle: async guild => { // keep the first arg for later
    if (guild.memberCount < 0) { //  || !guild.members.get(global.bot.user.id).permission.json['manageWebhooks']
      console.log('missing perms, byes')
      // guild.leave()
    } else {
      await createGuild(guild)
      await cacheGuild(guild.id)
    }
  }
}

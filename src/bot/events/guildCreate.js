const createGuild = require('../../db/interfaces/postgres/create').createGuild

module.exports = {
  name: 'guildCreate',
  type: 'on',
  handle: async guild => {
    if (guild.memberCount < 10 || !guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) {
      guild.leave()
    } else {
      await createGuild(guild)
    }
  }
}

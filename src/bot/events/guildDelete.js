const deleteGuild = require('../../db/interfaces/postgres/delete').deleteGuild

module.exports = {
  name: 'guildDelete',
  type: 'on',
  handle: async guild => {
    if (guild.memberCount < 10 || !guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) {
      guild.leave()
    } else {
      await deleteGuild(guild.id)
    }
  }
}

const deleteGuild = require('../../db/interfaces/postgres/delete').deleteGuild

module.exports = {
  name: 'guildDelete',
  type: 'on',
  handle: async guild => {
    await deleteGuild(guild.id)
  }
}

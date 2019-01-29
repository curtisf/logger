const r = require('../../clients/rethink')

exports.deleteGuild = async function (guildID) {
  return await r.db('Logger').table('Guilds').get(guildID).delete().run()
}

exports.deleteUser = async function (userID) {
  return await r.db('Logger').table('Users').get(userID).delete().run()
}

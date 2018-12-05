const r = require('../../clients/rethink')

async function getAllGuilds () {
  return await r.db('Logger').table('Guilds').run()
}

async function getGuild (guildID) {
  return await r.db('Logger').table('Guilds').get(guildID).run()
}

exports.getAllGuilds = getAllGuilds
exports.getGuild = getGuild

const r = require('../../clients/rethink')
const createGuild = require('./create').createGuild
const createUserDocument = require('./create').createUserDocument

function getAllGuilds () {
  return r.db('Logger').table('Guilds').run()
}

async function getGuild (guildID) {
  const doc = await r.db('Logger').table('Guilds').get(guildID).run()
  if (!doc) {
    await createGuild(guildID)
    return exports.getGuild(guildID)
  }
  return doc
}

function getUsers () {
  return r.db('Logger').table('Users').run()
}

async function getUser (userID) {
  const userDoc = await r.db('Logger').table('Users').get(userID).run()
  if (!userDoc) {
    await createUserDocument(userID)
    return exports.getGuild(userID)
  }
  return userDoc
}

exports.getUser = getUser
exports.getAllGuilds = getAllGuilds
exports.getGuild = getGuild
exports.getUsers = getUsers

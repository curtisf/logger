const r = require('../../clients/rethink')
const createGuild = require('./create').createGuild
const createUserDocument = require('./create').createUserDocument

async function getAllGuilds () {
  return await r.db('Logger').table('Guilds').run()
}

async function getGuild (guildID) {
  let doc = await r.db('Logger').table('Guilds').get(guildID).run()
  if (!doc) {
    await createGuild(guildID)
    return await exports.getGuild(guildID)
  }
  return doc
}

async function getUsers () {
  return await r.db('Logger').table('Users').run()
}

async function getUser (userID) {
  let userDoc = await r.db('Logger').table('Users').get(userID).run()
  if (!userDoc) {
    await createUserDocument(userID)
    return await exports.getGuild(userID)
  }
  return userDoc
}

exports.getUser = getUser
exports.getAllGuilds = getAllGuilds
exports.getGuild = getGuild
exports.getUsers = getUsers

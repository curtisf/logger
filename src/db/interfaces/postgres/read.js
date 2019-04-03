const pool = require('../../clients/postgres')
const createGuild = require('./create').createGuild
const createUserDocument = require('./create').createUserDocument
const aes = require('../../aes')

async function getAllGuilds () {
  const doc = await pool.query('SELECT * FROM guilds;')
  return doc.rows
}

async function getGuild (guildID) {
  const doc = await pool.query('SELECT * FROM guilds WHERE id=$1;', [guildID])
  if (doc.rows.length === 0) {
    if (global.bot.guilds.get(guildID)) {
      await createGuild(global.bot.guilds.get(guildID))
      return await getGuild(guildID)
    }
  }
  return doc.rows[0]
}

async function getUsers () {
  const doc = await pool.query('SELECT * FROM users;')
  doc.rows = doc.rows.map(async (u) => await decryptUserDoc(u))
  return doc.rows
}

async function getUser (userID) {
  const doc = await pool.query('SELECT * FROM users WHERE id=$1', [userID])
  if (doc.rows.length === 0) {
    await createUserDocument(userID)
    return exports.getUser(userID)
  }
  const decryptedDoc = await decryptUserDoc(doc.rows[0])
  return decryptedDoc
}

async function getMessagesByAuthor (userID) {
  const resp = await pool.query('SELECT * FROM messages WHERE author_id=$1', [userID])
  const promiseArray = resp.rows.map(m => {
    const decryptedMessage = decryptMessageDoc(m)
    return decryptedMessage
  })
  const done = await Promise.all(promiseArray)
  return done
}

async function getMessageById (messageID) {
  let message = await pool.query('SELECT * FROM messages WHERE id=$1', [messageID])
  if (message.rows.length === 0) return null
  message = await decryptMessageDoc(message.rows[0])
  return message
}

async function decryptUserDoc (userDoc) {
  userDoc.names = JSON.parse(aes.decrypt(userDoc.names))
  return userDoc
}

async function decryptMessageDoc (message) {
  message.content = aes.decrypt(message.content)
  if (message.attachment_b64) message.attachment_b64 = aes.decrypt(message.attachment_b64)
  return message
}

async function getAllMessages () {
  const messages = await pool.query('SELECT * FROM messages')
  return messages.rows
}

exports.getMessageById = getMessageById
exports.getMessagesByAuthor = getMessagesByAuthor
exports.getUser = getUser
exports.getAllGuilds = getAllGuilds
exports.getGuild = getGuild
exports.getUsers = getUsers
exports.getAllMessages = getAllMessages

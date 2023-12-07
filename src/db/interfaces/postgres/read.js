const pool = require('../../clients/postgres')
const createGuild = require('./create').createGuild
const aes = require('../../aes')
const { postgresQueryExecution } = require('../../../miscellaneous/prometheus')

async function getAllGuilds () {
  const queryStartTimer = postgresQueryExecution.startTimer()
  const doc = await pool.query('SELECT * FROM guilds;')
  queryStartTimer({ context: 'getAllGuilds' })
  return doc.rows
}

async function getGuild (guildID) {
  const queryStartTimer = postgresQueryExecution.startTimer()
  const doc = await pool.query('SELECT * FROM guilds WHERE id=$1;', [guildID])
  queryStartTimer({ context: 'getGuild' })
  if (doc.rows.length === 0) {
    if (global.bot.guilds.get(guildID)) {
      await createGuild(global.bot.guilds.get(guildID))
      return await getGuild(guildID)
    }
  }
  return doc.rows[0]
}

async function getMessagesByAuthor (userID) {
  const queryStartTimer = postgresQueryExecution.startTimer()
  const resp = await pool.query('SELECT * FROM messages WHERE author_id=$1', [userID])
  const promiseArray = resp.rows.map(m => {
    const decryptedMessage = decryptMessageDoc(m)
    return decryptedMessage
  })
  const done = await Promise.all(promiseArray)
  queryStartTimer({ context: 'getMessagesByAuthor' })
  return done
}

async function getMessageById (messageID) {
  const queryStartTimer = postgresQueryExecution.startTimer()
  let message = await pool.query('SELECT * FROM messages WHERE id=$1', [messageID])
  queryStartTimer({ context: 'getMessageById' })
  if (message.rows.length === 0) return null
  message = await decryptMessageDoc(message.rows[0])
  return message
}

async function decryptMessageDoc (message) {
  message.content = (await aes.decrypt([message.content]))?.[0]
  return message
}

async function decryptMessageDocs (messagesArray) {
  const messageContentsToDecrypt = messagesArray.map(m => m.content)
  const decryptedMessageContents = await aes.decrypt(messageContentsToDecrypt)
  for (let i = 0; i < messagesArray.length; i++) { // same order is used returning from aes.decrypt
    messagesArray[i].content = decryptedMessageContents[i]
  }
  return messagesArray
}

async function getMessagesByIds (messageIds) {
  const queryStartTimer = postgresQueryExecution.startTimer()
  const message = await pool.query('SELECT * FROM messages WHERE id = ANY ($1)', [messageIds])
  queryStartTimer({ context: 'getMessagesByIds' })
  if (message.rows.length === 0) return null
  const decryptedMessages = await decryptMessageDocs(message.rows)
  return decryptedMessages
}

exports.getMessageById = getMessageById
exports.getMessagesByAuthor = getMessagesByAuthor
exports.getAllGuilds = getAllGuilds
exports.getGuild = getGuild
exports.getMessagesByIds = getMessagesByIds

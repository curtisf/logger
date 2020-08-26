const sqlite = require('./clients/sqlite')
const aes = require('./aes')
const BATCH_SIZE = 1
const batch = []

async function addItem (messageAsArray) {
  batch.push(messageAsArray)
  if (batch.length >= BATCH_SIZE) {
    await submitBatch()
  }
}

async function submitBatch () {
  const toSubmit = batch.splice(0, 1)
  await sqlite.run('INSERT INTO messages (id, author_id, content, attachment_b64, ts) VALUES ($1, $2, $3, $4, $5)', toSubmit[0])
}

function getMessage (messageID) {
  const message = batch.find(m => m[0] === messageID)
  if (!message) return
  return {
    id: message[0],
    author_id: message[1],
    content: aes.decrypt(message[2]),
    attachment_b64: '',
    ts: Date.parse(message[4])
  }
}

function updateMessage (messageID, content) {
  for (let i = 0; i < batch.length; i++) {
    if (batch[i][0] === messageID) {
      batch[i][2] = aes.encrypt(content || 'None')
      break
    }
  }
}

exports.getMessage = getMessage
exports.addItem = addItem
exports.updateMessage = updateMessage
exports.submitBatch = submitBatch

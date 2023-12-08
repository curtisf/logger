require('dotenv').config()
const AES = require('aes256')
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads')

let aesWorker
let requestId = 0
const waitingPromises = {}
const waitingTimeouts = {}

function addWorkerListeners(threadWorker, shardRange) {
  threadWorker.on('message', async (message) => {
    if (waitingPromises[message.id]) {
      clearTimeout(waitingTimeouts[message.id])
      waitingPromises[message.id].resolve(message.data)
      delete waitingPromises[message.id]
      delete waitingTimeouts[message.id]
    }
  })
  threadWorker.on('error', (error) => {
    console.error(new Date().toUTCString(), `AES worker encountered error for shard range ${shardRange}`, error)
  })
  threadWorker.on('exit', (code) => {
    if (code === 0) {
      global.logger.info(new Date().toUTCString(), `[Master] AES worker stopped with exit code ${code} for shard range ${shardRange}`)
    } else {
      global.logger.error(new Date().toUTCString(), `[Master] AES worker stopped with exit code ${code} for shard range ${shardRange}`)
      createOrSetWorkerThread() // make a new thread and set listeners
      global.logger.startup(new Date().toUTCString(), `[Master] AES worker restarted for shard range ${shardRange}`)
    }
  })
}

// Provide a string array to encrypt with a worker thread, wait for the Promise and get an array of encrypted contents back
function encryptViaWorker(stringDataArray) {
  return new Promise((resolve, reject) => {
    const id = ++requestId
    waitingPromises[id] = { resolve, reject }
    waitingTimeouts[id] = setTimeout(() => {
      reject(new Error(`[Master] AES worker for cluster ${cluster.worker.rangeForShard} timed out waiting for encrypt response`))
      delete waitingPromises[id]
      delete waitingTimeouts[id]
    }, 5000)
    aesWorker?.postMessage({ type: 'encrypt', id, data: stringDataArray })
  })
}

// Provide a string array to decrypt with a worker thread, wait for the Promise and get an array of decrypted contents back
function decryptViaWorker(stringDataArray) {
  return new Promise((resolve, reject) => {
    const id = ++requestId
    waitingPromises[id] = { resolve, reject }
    waitingTimeouts[id] = setTimeout(() => {
      reject(new Error(`[Master] AES worker for cluster ${cluster.worker.rangeForShard} timed out waiting for decrypt response`))
      delete waitingPromises[id]
      delete waitingTimeouts[id]
    }, 5000)
    aesWorker?.postMessage({ type: 'decrypt', id, data: stringDataArray })
  })
}

// Create a worker thread for encrypt/decrypt of string contents
function createOrSetWorkerThread() {
  aesWorker = new Worker(__filename, { workerData: { aesKey: process.env.AES_KEY, cluster: cluster.worker.rangeForShard } })
  addWorkerListeners(aesWorker, cluster.worker.rangeForShard)
}

if (isMainThread) {
  createOrSetWorkerThread()
  global.logger.startup(new Date().toUTCString(), `[Master] AES worker started for shard range ${cluster.worker.rangeForShard}`)
} else {
  global.logger = require('../miscellaneous/logger') // set logger for worker thread

  global.logger.startup(new Date().toUTCString(), `[Worker] AES worker init working on shard range ${workerData.cluster}`)
  const cipher = AES.createCipher(workerData.aesKey)
  parentPort.on('message', async (message) => {
    if (message.type === 'encrypt' && Array.isArray(message.data)) {
      try {
        const encryptedContent = message.data.map(content => cipher.encrypt(content))
        parentPort.postMessage({ id: message.id, data: encryptedContent })
      } catch (e) {
        global.logger.error(`[Worker] AES worker failed to encrypt content${message.data.some(d => d == null) ? ', has null(s)' : ''}`, e)
      }
    } else if (message.type === 'decrypt' && Array.isArray(message.data)) {
      try {
        const decryptedContent = message.data.map(content => cipher.decrypt(content))
        parentPort.postMessage({ id: message.id, data: decryptedContent })
      } catch (e) {
        global.logger.error(`[Worker] AES worker failed to decrypt content${message.data.some(d => d == null) ? ', has null(s)' : ''}`, e)
      }
    }
  })
}

exports.encrypt = encryptViaWorker
exports.decrypt = decryptViaWorker

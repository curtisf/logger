// Basically taken from https://github.com/discordware/eris-sharder/blob/dev/src/structures/SyncedRequestHandler.js

const crypto = require('crypto')
const returnMap = new Map()

process.on('message', m => {
  try {
    m = JSON.parse(m)
  } catch (e) {
    global.logger.error('A request response returned is not JSON parseable!')
    console.error(e)
    return
  }
  if (m && m.type === 'fetchReturn') {
    const toExecute = returnMap.get(m.id)
    if (toExecute) {
      toExecute.fn(m)
    }
  }
})

function registerEvent (id, callback) {
  returnMap.set(id, { fn: callback })
}

function unregisterEvent (id) {
  returnMap.delete(id)
}

module.exports = {
  request: async function (method, url, auth, body, file, _route, short) {
    return new Promise((resolve, reject) => {
      const stackCapture = new Error().stack
      const requestID = crypto.randomBytes(16).toString('hex')

      if (file && file.file) file.file = Buffer.from(file.file).toString('base64')

      process.send({ type: 'apiRequest', requestID, method, url, auth, body, file, _route, short })

      // if the request is to post a log via webhook, don't time it since
      // log channels can be backed up a ton
      if (method === 'POST' && url.includes('/webhooks/')) resolve()
      const timeout = setTimeout(() => {
        reject(new Error(`Request timed out (>${this.timeout}ms) on ${method} ${url}`))

        unregisterEvent(`apiResponse.${requestID}`)
      }, 15000 + (url.endsWith('/messages') ? 120000 : 0))

      registerEvent(`apiResponse.${requestID}`, data => {
        if (data.err) {
          const error = new Error(data.err.message)

          error.stack = data.err.stack + '\n' + stackCapture.substring(stackCapture.indexOf('\n') + 1)
          error.code = data.err.code

          reject(error)
        } else {
          resolve(data.data)
        }

        clearTimeout(timeout)
        unregisterEvent(`apiResponse.${requestID}`)
      })
    })
  }
}

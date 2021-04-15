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
      global.bot.emit('rest-request', null)

      // if the request is to post a log via webhook, don't time it since
      // log channels can be backed up a ton
      const timeout = setTimeout(() => {
        global.bot.emit('rest-timeout', null)
        reject(new Error(`Request timed out (>${this.timeout}ms) on ${method} ${url}`))

        unregisterEvent(`apiResponse.${requestID}`)
      }, 1000 * 60 * 20)
      // if 20 minutes isn't long enough for the central rest client to respond, may god save our souls

      registerEvent(`apiResponse.${requestID}`, data => {
        clearTimeout(timeout)
        unregisterEvent(`apiResponse.${requestID}`)

        if (data.err) {
          const error = new Error(data.err.message)

          error.stack = data.err.stack + '\n' + stackCapture.substring(stackCapture.indexOf('\n') + 1)
          error.code = data.err.code

          reject(error)
        } else {
          resolve(data.data)
        }
      })
    })
  },
  getWaitingRequestCount: function () {
    return returnMap.size
  }
}

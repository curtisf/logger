const { EventEmitter } = require('events')

module.exports = class Communicator extends EventEmitter {
  constructor () {
    super()
  }
}

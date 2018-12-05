const fs = require('fs')
const path = require('path')
const GenericCommand = require('../bot/bases/GenericCommand')

module.exports = () => {
  let files = fs.readdirSync(path.resolve('src', 'bot', 'commands'))
  let tempCommands = []
  files.forEach((filename) => {
    let command = new GenericCommand(require(path.resolve('src', 'bot', 'commands', filename)))
  })
}

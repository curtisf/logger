const fs = require('fs')
const path = require('path')
const GenericCommand = require('../bot/bases/GenericCommand')

module.exports = () => {
  const files = fs.readdirSync(path.resolve('src', 'bot', 'commands'))
  files.forEach(filename => {
    new GenericCommand(require(path.resolve('src', 'bot', 'commands', filename)))
  })
}

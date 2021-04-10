const fs = require('fs')
const path = require('path')
const GenericCommand = require('../bot/bases/GenericCommand')

module.exports = () => {
  const files = fs.readdirSync(path.resolve('src', 'bot', 'commands'))
  files.forEach(filename => {
    if (require.cache[path.resolve('src', 'bot', 'commands', filename)]) {
      delete require.cache[path.resolve('src', 'bot', 'commands', filename)]
    }
    // truly gross code that should be remade eventually
    new GenericCommand(require(path.resolve('src', 'bot', 'commands', filename)))
  })
}

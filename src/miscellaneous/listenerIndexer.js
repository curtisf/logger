const fs = require('fs')
const path = require('path')

module.exports = () => {
  const files = fs.readdirSync(path.resolve('src', 'bot', 'events'))
  const once = []
  const on = []
  files.forEach(filename => {
    const event = require(path.resolve('src', 'bot', 'events', filename))
    event.name = event.name.replace('.js', '')
    if (event.type === 'once') {
      once.push({ name: event.name, handle: event.handle })
    } else {
      on.push({ name: event.name, handle: event.handle })
    }
  })
  return [on, once]
}

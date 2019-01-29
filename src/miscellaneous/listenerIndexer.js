const fs = require('fs')
const path = require('path')

module.exports = () => {
  let files = fs.readdirSync(path.resolve('src', 'bot', 'events'))
  let once = []
  let on = []
  files.forEach((filename) => {
    let event = require(path.resolve('src', 'bot', 'events', filename))
    event.name = event.name.replace('.js', '')
    if (event.type === 'once') {
      once.push({ name: event.name, handle: event.handle })
    } else {
      on.push({ name: event.name, handle: event.handle })
    }
  })
  return [on, once]
}

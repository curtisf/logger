const util = require('util')

module.exports = {
  func: async (message, suffix) => {
    try {
      const returned = eval(suffix) // eslint-disable-line no-eval
      let str = util.inspect(returned, {
        depth: 1
      })
      if (str.length > 1900) {
        str = `${str.substr(0, 1897)}...`
      }
      str = str.replace(new RegExp(process.env.BOT_TOKEN, 'gi'), '( ͡° ͜ʖ ͡°)') // thanks doug
      message.channel.createMessage('```xl\n' + str + '\n```').then(ms => {
        if (returned !== undefined && returned !== null && typeof returned.then === 'function') {
          returned.then(() => {
            str = util.inspect(returned, {
              depth: 1
            })
            if (str.length > 1900) {
              str = str.substr(0, 1897)
              str = str + '...'
            }
            ms.edit('```xl\n' + str + '\n```')
          }, e => {
            str = util.inspect(e, {
              depth: 1
            })
            if (str.length > 1900) {
              str = str.substr(0, 1897)
              str = str + '...'
            }
            ms.edit('```xl\n' + str + '\n```')
          })
        }
      }).catch(() => { })
    } catch (e) {
      message.channel.createMessage('```xl\n' + e + '\n```').catch(() => { })
    }
  },
  name: 'eval',
  description: 'Bot owner debug command.',
  type: 'creator'
}

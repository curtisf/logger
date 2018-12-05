const util = require('util')

module.exports = {
  func: async (message, suffix) => {
    try {
      var returned = eval(suffix) // eslint-disable-line no-eval
      var str = util.inspect(returned, {
        depth: 1
      })
      if (str.length > 1900) {
        str = str.substr(0, 1897)
        str = str + '...'
      }
      str = str.replace(new RegExp(process.env.BOT_TOKEN, 'gi'), '( ͡° ͜ʖ ͡°)') // thanks doug
      message.channel.createMessage('```xl\n' + str + '\n```').then((ms) => {
        if (returned !== undefined && returned !== null && typeof returned.then === 'function') {
          returned.then(() => {
            var str = util.inspect(returned, {
              depth: 1
            })
            if (str.length > 1900) {
              str = str.substr(0, 1897)
              str = str + '...'
            }
            ms.edit('```xl\n' + str + '\n```')
          }, (e) => {
            var str = util.inspect(e, {
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

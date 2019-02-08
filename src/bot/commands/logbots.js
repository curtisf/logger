const webhookCache = require('../modules/webhookcache')
const toggleLogBots = require('../../db/interfaces/postgres/update').toggleLogBots

module.exports = {
  func: async message => {
    let state = await toggleLogBots(message.channel.guild.id)
    await message.channel.createMessage({
      embed: {
        'title': `${state ? 'I am now logging bot activity.' : 'I am no longer logging bot activity.'}`,
        'color': 16711680,
        'timestamp': new Date(),
        'footer': {
          'icon_url': global.bot.user.avatarURL,
          'text': `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        'author': {
          'name': `${message.author.username}#${message.author.discriminator}`,
          'icon_url': message.author.avatarURL
        },
        'fields': []
      }
    })
  },
  name: 'logbots',
  description: 'Use this to toggle whether I log bots or not (DEFAULT: No)',
  type: 'admin',
  category: 'Logging'
}

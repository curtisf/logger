const disableEvent = require('../../db/interfaces/rethink/update').disableEvent
const eventList = require('../utils/constants').ALL_EVENTS

module.exports = {
  func: async (message, suffix) => {
    let split = suffix.split(' ')
    if (!eventList.includes(split[0])) {
      return message.channel.createMessage({ embed: {
        'description': `The provided argument is invalid. Valid events: ${eventList.join(', ')}`,
        'color': 16711680,
        'timestamp': new Date(),
        'footer': {
          'icon_url': global.bot.user.avatarURL,
          'text': `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        'author': {
          'name': `${message.author.username}#${message.author.discriminator}`,
          'icon_url': message.author.avatarURL
        }
      } })
    }
    let disabled = disableEvent(message.channel.guild.id, split[0])
    let respStr = `Toggled ${split[0]}.`
    message.channel.createMessage({ embed: {
      'description': respStr,
      'color': 3553599,
      'timestamp': new Date(),
      'footer': {
        'icon_url': global.bot.user.avatarURL,
        'text': `${global.bot.user.username}#${global.bot.user.discriminator}`
      },
      'author': {
        'name': `${message.author.username}#${message.author.discriminator}`,
        'icon_url': message.author.avatarURL
      }
    } })
  },
  name: 'togglemodule',
  description: 'Ignore any event provided after this command. Toggleable.',
  type: 'custom',
  perm: 'manageChannels',
  category: 'Logging'
}

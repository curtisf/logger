const webhookCache = require('../modules/webhookcache')
const clearEventByID = require('../../db/interfaces/postgres/update').clearEventByID

module.exports = {
  func: async message => {
    if (!message.channel.guild.members.get(global.bot.user.id).permission.json['sendMessages']) {
      return
    }
    await clearEventByID(message.channel.guild.id, message.channel.id) // any event logging to this channel id will be wiped
    
    await message.channel.createMessage({
      embed: {
        'title': 'Any events associated with this channel have been undone.',
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
  name: 'clearchannel',
  description: 'Use this in a log channel to stop me from logging to here.',
  type: 'admin',
  category: 'Logging'
}

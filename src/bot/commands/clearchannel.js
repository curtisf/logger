const webhookCache = require('../modules/webhookcache')
const clearEventByID = require('../../db/interfaces/postgres/update').clearEventByID

module.exports = {
  func: async message => {
    await webhookCache.deleteWebhook(message.channel.id)
    await clearEventByID(message.channel.guild.id, message.channel.id) // any event logging to this channel id will be wiped
    try {
      const split = str.split('|')
      await global.bot.deleteWebhook(split[0], split[1], `Clearing logging configs from this channel - ${message.author.username}#${message.author.discriminator}`)
      // remove the webhook to clean up
    } catch (_) {}
    await message.channel.createMessage({
      embed: {
        'title': 'Any events associated with this channel along with the webhook has been undone.',
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

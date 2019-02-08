const webhookCache = require('../modules/webhookcache')
const clearEventByID = require('../../db/interfaces/postgres/update').clearEventByID

module.exports = {
  func: async message => {
    const str = await webhookCache.getWebhook(message.channel.id)
    if (!str) return await message.channel.createMessage('I\'m not logging here!')
    await webhookCache.deleteWebhook(message.channel.id)
    await clearEventByID(message.channel.guild.id, message.channel.id)
    try {
      const split = str.split('|')
      await global.bot.deleteWebhook(split[0], split[1], `Clearing logging configs from this channel - ${message.author.username}#${message.author.discriminator}`)
    } catch (_) {}
    await message.channel.createMessage({
      embed: {
        'title': 'Done clearing configs from this channel.',
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

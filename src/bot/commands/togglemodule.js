const disableEvent = require('../../db/interfaces/postgres/update').disableEvent
const eventList = require('../utils/constants').ALL_EVENTS

module.exports = {
  func: async (message, suffix) => {
    const split = suffix.split(' ')
    if (!eventList.includes(split[0])) {
      return message.channel.createMessage({
        embeds: [{
          description: `The provided argument is invalid. Valid events: ${eventList.join(', ')}`,
          color: 16711680,
          timestamp: new Date(),
          footer: {
            icon_url: global.bot.user.avatarURL,
            text: `${global.bot.user.username}#${global.bot.user.discriminator}`
          },
          author: {
            name: `${message.author.username}#${message.author.discriminator}`,
            icon_url: message.author.avatarURL
          }
        }]
      })
    }
    const disabled = await disableEvent(message.channel.guild.id, split[0])
    const respStr = `${!disabled ? 'Enabled' : 'Disabled'} ${split[0]}.`
    message.channel.createMessage({
      embeds: [{
        description: respStr,
        color: 3553599,
        timestamp: new Date(),
        footer: {
          icon_url: global.bot.user.avatarURL,
          text: `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        author: {
          name: `${message.author.username}#${message.author.discriminator}`,
          icon_url: message.author.avatarURL
        }
      }]
    })
  },
  name: 'togglemodule',
  quickHelp: `[DEPRECATED]\nIgnore any event provided after this command. You should have no need for this command when you can stop an event from logging by using ${process.env.GLOBAL_BOT_PREFIX}stoplogging or by signing into [the dashboard](https://logger.bot).`,
  examples: 'Unneccesary, this command is deprecated.',
  type: 'custom',
  perm: 'manageChannels',
  category: 'Logging'
}

const ignoreChannel = require('../../db/interfaces/rethink/update').ignoreChannel

module.exports = {
  func: async (message, suffix) => {
    let disabled = ignoreChannel(message.channel.guild.id, message.channel.id)
    let respStr = `Toggled logging events targeting <#${message.channel.id}> (${message.channel.name})`
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
  name: 'ignorechannel',
  description: 'Ignore any event that originates from the channel this command is used in. Toggleable.',
  type: 'custom',
  perm: 'manageChannels',
  category: 'Logging'
}

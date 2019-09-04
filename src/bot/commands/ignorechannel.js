const ignoreChannel = require('../../db/interfaces/postgres/update').ignoreChannel

module.exports = {
  func: async message => {
    let disabled = await ignoreChannel(message.channel.guild.id, message.channel.id) // return a boolean representing whether a channel is ignored or not
    const respStr = `Toggled logging events targeting <#${message.channel.id}> (${message.channel.name}). I am now ${disabled ? 'ignoring' : 'logging'} events from this channel`
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

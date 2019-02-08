const deleteUser = require('../../db/interfaces/postgres/delete').deleteUser

module.exports = {
  func: async message => {
    await deleteUser(message.author.id)
    await message.channel.createMessage({
      embed: {
        'title': 'Done clearing your data.',
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
  name: 'clearmydata',
  description: 'Removes all saved names of yours from my DB.',
  type: 'any',
  category: 'Utility'
}

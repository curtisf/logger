const deleteGuild = require('../../db/interfaces/postgres/delete').deleteGuild
const createGuild = require('../../db/interfaces/postgres/create').createGuild

module.exports = {
  func: async message => {
    const msg = await message.channel.createMessage({ embed: {
      'description': `Are you absolutely sure, ${message.author.username}#${message.author.discriminator} (${message.author.id})? Reply *yes* if so.`,
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
    let i = 0
    let complete = false
    global.bot.on('messageCreate', async function temp (m) {
      if (i === 0) {
        let timeout = setTimeout(() => {
          global.bot.removeListener('messageCreate', temp)
          if (!complete) {
            message.channel.createMessage({ embed: {
              'description': 'You didn\'t reply with *yes* within 10 seconds.',
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
            msg.delete()
          }
        }, 10000)
      }
      if (m.channel.id === message.channel.id && m.author.id === message.author.id && m.content.toLowerCase() === 'yes' && !complete) {
        message.channel.createMessage({ embed: {
          'description': 'Alright, resetting guild settings.',
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
        complete = true
        await deleteGuild(message.channel.guild.id)
        await createGuild(message.channel.guild)
        return
      }
      i = i + 1
    })
  },
  name: 'reset',
  description: 'Completely resets my stored settings for your server. **Use with caution**.',
  type: 'admin',
  category: 'Administration'
}

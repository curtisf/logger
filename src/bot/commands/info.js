module.exports = {
  func: async message => {
    await message.channel.createMessage({
      embed: {
        'title': 'Configuration dashboard',
        'description': `Hey, I'm ${global.bot.user.username}! My **only** purpose is to, at your command, log everything to your configured channels. Click "configuration dashboard" to login to my dashboard and configure me!`,
        'url': 'https://logger.bot',
        'color': 3553599,
        'timestamp': new Date(),
        'footer': {
          'icon_url': global.bot.user.avatarURL,
          'text': `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        'thumbnail': {
          'url': global.bot.user.avatarURL
        },
        'author': {
          'name': `${message.author.username}#${message.author.discriminator}`,
          'icon_url': message.author.avatarURL
        },
        'fields': [
          {
            'name': 'Technical Details',
            'value': `${global.bot.user.username} is written in JavaScript utilizing the Node.js runtime. It uses the [eris](https://github.com/abalabahaha/eris) library to interact with the Discord API. PostgreSQL and Redis are used. I am OSS at https://github.com/caf203/loggerv3`
          },
          {
            'name': 'The Author',
            'value': 'Logger is developed and maintained by [James Bond#0007](https://github.com/caf203). You can contact him via my [home server](https://discord.gg/ed7Gaa3).'
          },
          {
            'name': 'Bot Info',
            'value': 'Click on the configuration dashboard link to learn more.'
          },
          {
            'name': 'Shard Info',
            'value': `Shard ID: ${message.channel.guild.shard.id}\nWebsocket latency: ${message.channel.guild.shard.latency}\nStatus: ${message.channel.guild.shard.status}`
          }
        ]
      }
    })
  },
  name: 'info',
  description: 'Get information about Logger and the current shard.',
  type: 'any',
  category: 'Information'
}
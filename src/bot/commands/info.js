module.exports = {
  func: async message => {
    await message.channel.createMessage({
      embeds: [{
        title: 'Configuration dashboard',
        description: `Hey, I'm ${global.bot.user.username}! My **only** purpose is to, at your command, log everything to your configured channels. Click "configuration dashboard" to login to my dashboard and configure me!`,
        url: 'https://logger.bot',
        color: 3553599,
        timestamp: new Date(),
        footer: {
          icon_url: global.bot.user.avatarURL,
          text: `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        thumbnail: {
          url: global.bot.user.avatarURL
        },
        author: {
          name: `${message.author.username}#${message.author.discriminator}`,
          icon_url: message.author.avatarURL
        },
        fields: [
          {
            name: 'Technical Details',
            value: `${global.bot.user.username} is written in JavaScript utilizing the Node.js runtime. It uses the [eris](https://github.com/abalabahaha/eris) library to interact with the Discord API. PostgreSQL and Redis are used. I am OSS at https://github.com/curtisf/logger`
          },
          {
            name: 'The Author',
            value: 'Logger is developed and maintained by [piero#5432](https://github.com/curtisf). You can contact him via my [home server](https://discord.gg/ed7Gaa3).'
          },
          {
            name: 'Bot Info',
            value: 'Click on the configuration dashboard link to learn more.'
          },
          {
            name: 'Shard Info',
            value: `Shard ID: ${message.channel.guild.shard.id}\nWebsocket latency: ${message.channel.guild.shard.latency}\nStatus: ${message.channel.guild.shard.status}`
          },
          {
            name: 'Privacy Policy',
            value: 'You can view the privacy policy [here](https://gist.github.com/curtisf/0598b0930c11363d24e29300cf21d572). Similarly, if you want updates on when it changes, join my support server and follow the #privacy-policy channel.'
          }
        ]
      }]
    })
  },
  name: 'info',
  quickHelp: 'Get information about how Logger was made and the current shard serving you.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}info\``,
  type: 'any',
  category: 'Information'
}

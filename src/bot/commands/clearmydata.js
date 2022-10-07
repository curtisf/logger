module.exports = {
  func: async message => {
    await message.channel.createMessage({
      embeds: [{
        title: 'Action needed:',
        description: 'To clear your data (messages), please join [my support server](https://discord.gg/ed7Gaa3) and ask in the bot support channel OR join the server and private message `piero#5432`. Remember: all messages stored are removed automatically after two days from the database.',
        color: 16711680,
        timestamp: new Date(),
        footer: {
          icon_url: global.bot.user.avatarURL,
          text: `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        author: {
          name: `${message.author.username}#${message.author.discriminator}`,
          icon_url: message.author.avatarURL
        },
        fields: []
      }]
    })
  },
  name: 'clearmydata',
  quickHelp: 'Provides the information needed to clear your data from the bot. Your stored data (messages) is automatically deleted after two days from the database regardless of using this command.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}clearmydata\``,
  type: 'any',
  category: 'Utility'
}

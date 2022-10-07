const Eris = require('eris')
const { getAuthorField } = require('../utils/embeds.js')

module.exports = {
  name: 'clearmydata',
  func: async interaction => {
    interaction.createMessage({
      embeds: [{
        title: 'Action needed:',
        description: 'To clear your data (messages), please join [my support server](https://discord.gg/ed7Gaa3) and ask in the bot support channel OR join the server and private message `piero#5432`. Remember: all messages stored are removed automatically after two days from the database.',
        color: 16711680,
        timestamp: new Date(),
        footer: {
          icon_url: global.bot.user.avatarURL,
          text: `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        author: getAuthorField(interaction.member.user),
        fields: []
      }],
      flags: Eris.Constants.MessageFlags.EPHEMERAL
    }).catch(() => { })
  }
}

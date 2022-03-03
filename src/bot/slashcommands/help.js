const { EMBED_COLORS } = require('../utils/constants')
const { getEmbedFooter } = require('../utils/embeds')

module.exports = {
  name: 'help',
  func: async interaction => {
    if (!interaction.data.options) {
      // general help
      interaction.createMessage({
        embed: {
          title: 'General Help',
          description: `**How do I configure ${global.bot.user.username}?**\nSee \`/help guide: Usage\` for a short setup guide.`,
          color: EMBED_COLORS.PURPLED_BLUE,
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          fields: [{
            inline: true,
            name: 'Open Source',
            value: 'See https://github.com/curtisf/logger for current code.'
          }, {
            inline: true,
            name: 'Dashboard',
            value: 'Accessible at [https://logger.bot](https://logger.bot)'
          }, {
            inline: false,
            name: 'Privacy Policy',
            value: 'You can view the privacy policy [here](https://gist.github.com/curtisf/0598b0930c11363d24e29300cf21d572). If you want updates when it changes, join my support server and follow the #privacy-policy channel.'
          }, {
            inline: true,
            name: 'Support',
            value: 'See `/help event: eventname` for any event you want further clarification on. If something is going terribly wrong, go ahead and join [my support server](https://discord.gg/ed7Gaa3)'
          }, {
            inline: false,
            name: 'Patreon',
            value: 'If you like me and want to support my owner (or want patron bot features), check out [my Patreon page](https://patreon.com/logger).\nSome patron features include: image logging, see who deletes messages, ignore users, prettified archive & bulk delete logs, archive up to 10,000 messages, and messages are cached for a week instead of two days.'
          }],
          footer: getEmbedFooter(global.bot.user)
        }
      }).catch(() => {})
    }
  }
}

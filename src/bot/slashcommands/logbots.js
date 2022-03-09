const { toggleLogBots } = require('../../db/interfaces/postgres/update')
const { EMBED_COLORS } = require('../utils/constants')
const { getEmbedFooter, getAuthorField } = require('../utils/embeds')

module.exports = {
  name: 'logbots',
  botPerms: ['manageWebhooks', 'manageChannels'],
  userPerms: ['manageWebhooks', 'manageChannels'],
  func: async interaction => {
    try {
      const isLoggingBots = await toggleLogBots(interaction.guildID)
      interaction.createMessage({
        embeds: [{
          description: `Successfully __${isLoggingBots ? 'enabled' : 'disabled'}__ logging edit/deletes of messages that are made by a bot.`,
          color: EMBED_COLORS.GREEN,
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          author: getAuthorField(interaction.member.user),
          footer: getEmbedFooter(global.bot.user)
        }]
      }).catch(() => {})
    } catch (e) {
      global.logger.error(e)
      interaction.createMessage({
        embeds: [{
          title: 'Error',
          description: 'There was a problem while toggling logbots, try again',
          color: EMBED_COLORS.RED,
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          author: getAuthorField(interaction.member.user),
          footer: getEmbedFooter(global.bot.user)
        }]
      }).catch(() => {})
    }
  }
}

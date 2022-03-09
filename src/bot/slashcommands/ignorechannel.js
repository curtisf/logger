const { ignoreChannel, clearIgnoredChannels } = require('../../db/interfaces/postgres/update')
const { EMBED_COLORS } = require('../utils/constants.js')
const { getAuthorField, getEmbedFooter } = require('../utils/embeds.js')

module.exports = {
  name: 'ignorechannel',
  userPerms: ['manageWebhooks', 'manageChannels'],
  botPerms: ['manageWebhooks', 'manageChannels'],
  noThread: true,
  func: async interaction => {
    const listIgnoredChannelsOption = interaction.data.options?.find(o => o.name === 'optional')?.value === 'list'
    const resetIgnoredChannelsOption = interaction.data.options?.find(o => o.name === 'optional')?.value === 'reset'
    if (listIgnoredChannelsOption) {
      interaction.createMessage({
        embeds: [{
          title: 'Ignored Channels',
          description: global.bot.guildSettingsCache[interaction.guildID].ignoredChannels.map(id => {
            return `<#${id}> (${id})`
          }).join('\n') || 'No channels are explicitly ignored!',
          author: getAuthorField(interaction.member.user),
          footer: getEmbedFooter(global.bot.user)
        }]
      }).catch(global.logger.error)
    } else if (resetIgnoredChannelsOption) {
      await clearIgnoredChannels(interaction.guildID)
      interaction.createMessage({
        embeds: [{
          title: 'Ignored Channels',
          description: 'I am not ignoring any channels anymore (reset successful)',
          color: EMBED_COLORS.GREEN,
          author: getAuthorField(interaction.member.user),
          footer: getEmbedFooter(global.bot.user)
        }]
      }).catch(() => {})
    } else {
      const channelOption = interaction.data.options?.find(o => o.name === 'channel-to-ignore')
      if (channelOption && !global.bot.getChannel(channelOption.value)) {
        return interaction.createMessage({
          embeds: [{
            title: 'Unsuccessful',
            description: 'Channel not found.',
            thumbnail: {
              url: interaction.member.user.dynamicAvatarURL(null, 64)
            },
            color: EMBED_COLORS.RED
          }]
        }).catch(_ => {})
      }
      const isDisabled = await ignoreChannel(interaction.guildID, channelOption?.value || interaction.channel.id)
      interaction.createMessage({
        embeds: [{
          title: 'Success',
          description: `I am ${isDisabled ? 'ignoring' : 'logging'} events in <#${channelOption?.value || interaction.channel.id}>`,
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          color: EMBED_COLORS.GREEN
        }]
      })
    }
  }
}

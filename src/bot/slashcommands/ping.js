const { EMBED_COLORS } = require('../utils/constants.js')

module.exports = {
  name: 'ping',
  func: async interaction => {
    const start = new Date().getTime()
    try {
      await interaction.createMessage({
        embeds: [{
          title: 'Pong',
          description: `Fetching RTT time, gateway latency: ${global.bot.getChannel(interaction.channel.id).guild.shard.latency} ms`,
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          color: EMBED_COLORS.YELLOW_ORANGE
        }]
      })

      await interaction.editOriginalMessage({
        embeds: [{
          title: 'Pong',
          description: `I'm alive! Gateway latency: ${global.bot.getChannel(interaction.channel.id).guild.shard.latency} ms RTT time: ${new Date().getTime() - start}`,
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          color: EMBED_COLORS.GREEN
        }]
      })
    } catch (_) {}
  }
}

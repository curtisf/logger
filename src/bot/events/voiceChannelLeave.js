const send = require('../modules/webhooksender')

module.exports = {
  name: 'voiceChannelLeave',
  type: 'on',
  handle: async (member, channel) => {
    if (member) {
      if (global.bot.guildSettingsCache[channel.guild.id].isChannelIgnored(channel.id)) return
      await send({
        guildID: channel.guild.id,
        eventName: 'voiceChannelLeave',
        embeds: [{
          author: {
            name: `${member.username}#${member.discriminator} ${member.nick ? `(${member.nick})` : ''}`,
            icon_url: member.avatarURL
          },
          description: `**${member.username}#${member.discriminator}** ${member.nick ? `(${member.nick})` : ''} left ${channel.type !== 13 ? 'voice' : 'stage'} channel: ${channel.name}.`,
          fields: [{
            name: 'Channel',
            value: `<#${channel.id}> (${channel.name})`
          }, {
            name: 'ID',
            value: `\`\`\`ini\nUser = ${member.id}\nChannel = ${channel.id}\`\`\``
          }],
          color: 3553599
        }]
      })
    }
  }
}

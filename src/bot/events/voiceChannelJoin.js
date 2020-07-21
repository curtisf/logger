const send = require('../modules/webhooksender')
const statAggregator = require('../modules/statAggregator')

module.exports = {
  name: 'voiceChannelJoin',
  type: 'on',
  handle: async (member, channel) => {
    statAggregator.incrementEvent('voiceStateUpdate') // voice channel join is abstracted voice state update
    await send({
      guildID: channel.guild.id,
      eventName: 'voiceChannelJoin',
      embed: {
        author: {
          name: `${member.username}#${member.discriminator} ${member.nick ? `(${member.nick})` : ''}`,
          icon_url: member.avatarURL
        },
        description: `**${member.username}#${member.discriminator}** joined voice channel: ${channel.name}.`,
        fields: [{
          name: 'Channel',
          value: `<#${channel.id}> (${channel.name})`
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${member.id}\nChannel = ${channel.id}\`\`\``
        }],
        color: 3553599
      }
    })
  }
}

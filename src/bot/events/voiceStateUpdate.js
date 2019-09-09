const send = require('../modules/webhooksender')

module.exports = {
  name: 'voiceStateUpdate',
  type: 'on',
  handle: async (member, oldState) => {
    if (!member.guild.members.get(global.bot.user.id).permission.json['viewAuditLogs'] || !member.guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) return
    const state = member.voiceState
    const channel = member.guild.channels.get(state.channelID)
    if (!state.channelID || oldState.channelID) return
    if ((state.selfDeaf !== oldState.selfDeaf) || (state.selfMute !== oldState.selfMute)) return
    const voiceStateUpdateEvent = {
      guildID: member.guild.id,
      eventName: 'voiceStateUpdate',
      embed: {
        author: {
          name: `${member.username}#${member.discriminator} ${member.nick ? `(${member.nick})` : ''}`,
          icon_url: member.avatarURL
        },
        description: `**${member.username}#${member.discriminator}** ${member.nick ? `(${member.nick})` : ''} was `,
        fields: [{
          name: 'Voice Channel',
          value: `<#${channel.id}> (${channel.name})`
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${member.id}\nChannel = ${channel.id}\n`
        }],
        color: 3553599
      }
    }
    if (oldState.mute && !state.mute) voiceStateUpdateEvent.embed.description += 'unmuted'
    else if (!oldState.mute && state.mute) voiceStateUpdateEvent.embed.description += 'muted'
    else if (oldState.deaf && !state.deaf) voiceStateUpdateEvent.embed.description += 'undeafened'
    else if (!oldState.deaf && state.deaf) voiceStateUpdateEvent.embed.description += 'deafened'
    await setTimeout(async () => {
      const logs = await member.guild.getAuditLogs(1, null, 24).catch(() => {return})
      if (!logs) return
      const log = logs.entries[0]
      const user = logs.users[0]
      if (!log) return
      if (voiceStateUpdateEvent.embed.description.endsWith('was ')) return
      if (Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
        voiceStateUpdateEvent.embed.fields[1].value += `Perpetrator = ${user.id}\`\`\``
        voiceStateUpdateEvent.embed.footer = {
          text: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        }
        await send(voiceStateUpdateEvent)
      } else {
        await send(voiceStateUpdateEvent)
      }
    }, 1000)
  }
}

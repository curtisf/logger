const send = require('../modules/webhooksender')
const statAggregator = require('../modules/statAggregator')

module.exports = {
  name: 'voiceStateUpdate',
  type: 'on',
  handle: async (member, oldState) => {
    if (!member.guild.members.get(global.bot.user.id).permissions.json.viewAuditLogs || !member.guild.members.get(global.bot.user.id).permissions.json.manageWebhooks) return
    statAggregator.incrementEvent('voiceStateUpdate')
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
        description: `**${member.username}#${member.discriminator}** ${member.nick ? `(${member.nick})` : ''} had their voice state updated.`,
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
    // if (oldState.mute && !state.mute) voiceStateUpdateEvent.embed.description += 'unmuted'
    // else if (!oldState.mute && state.mute) voiceStateUpdateEvent.embed.description += 'muted'
    // else if (oldState.deaf && !state.deaf) voiceStateUpdateEvent.embed.description += 'undeafened'
    // else if (!oldState.deaf && state.deaf) voiceStateUpdateEvent.embed.description += 'deafened'
    const logs = await member.guild.getAuditLogs(5, null, 24).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === member.id)
    if (!log || Date.now() - ((log.id / 4194304) + 1420070400000) > 3000) return // if the most recent log is too far away, stop
    const user = log.user
    const actionName = Object.keys(log.before)[0]
    if (!actionName) return
    voiceStateUpdateEvent.embed.fields.unshift({
      name: 'Action',
      value: `${log.before[actionName] ? 'un' : 'now '}${actionName}` || 'Unknown'
    })
    voiceStateUpdateEvent.embed.fields[voiceStateUpdateEvent.embed.fields.length - 1].value += `Perpetrator = ${user.id}\`\`\``
    voiceStateUpdateEvent.embed.footer = {
      text: `${user.username}#${user.discriminator}`,
      icon_url: user.avatarURL
    }
    await send(voiceStateUpdateEvent)
  }
}

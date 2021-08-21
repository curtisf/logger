const send = require('../modules/webhooksender')

module.exports = {
  name: 'voiceStateUpdate',
  type: 'on',
  handle: async (member, oldState) => {
    const state = member.voiceState
    const channel = member.guild.channels.get(state.channelID)
    if (!state.channelID || oldState.channelID) return
    if ((state.selfDeaf !== oldState.selfDeaf) || (state.selfMute !== oldState.selfMute)) return
    if (global.bot.guildSettingsCache[member.guild.id].isChannelIgnored(state.channelID)) return
    const voiceStateUpdateEvent = {
      guildID: member.guild.id,
      eventName: 'voiceStateUpdate',
      embeds: [{
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
      }]
    }
    // if (member.guild.voiceStates.size < 20) {
    const logs = await member.guild.getAuditLogs({ limit: 5, actionType: 24 }).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === member.id && (Date.now() - ((e.id / 4194304) + 1420070400000) < 3000))
    if (!log) return
    const user = log.user
    const actionName = Object.keys(log.before)[0]
    if (!actionName) return
    voiceStateUpdateEvent.embeds[0].fields.unshift({
      name: 'Action',
      value: `${log.before[actionName] ? 'un' : 'now '}${actionName}` || 'Unknown'
    })
    if (user && user.id && user.username) {
      voiceStateUpdateEvent.embeds[0].fields[voiceStateUpdateEvent.embeds[0].fields.length - 1].value += `Perpetrator = ${user.id}\`\`\``
      voiceStateUpdateEvent.embeds[0].footer = {
        text: `${user.username}#${user.discriminator}`,
        icon_url: user.avatarURL
      }
    }
    await send(voiceStateUpdateEvent)
  }
}

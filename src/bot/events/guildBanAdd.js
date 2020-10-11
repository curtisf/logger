const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildBanAdd',
  type: 'on',
  handle: async (guild, user) => {
    if (!guild.members.get(global.bot.user.id).permissions.json.viewAuditLogs || !guild.members.get(global.bot.user.id).permissions.json.manageWebhooks) return
    const guildBanAddEvent = {
      guildID: guild.id,
      eventName: 'guildBanAdd',
      embed: {
        author: {
          name: `${user.username}#${user.discriminator} `,
          icon_url: user.avatarURL
        },
        description: `${user.username}#${user.discriminator} was banned`,
        fields: [{
          name: 'User Information',
          value: `${user.username}#${user.discriminator} (${user.id}) ${user.mention} ${user.bot ? '\nIs a bot' : ''}`
        }, {
          name: 'Reason',
          value: 'None provided'
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = Unknown\`\`\``
        }],
        color: 3553599
      }
    }
    const logs = await guild.getAuditLogs(5, null, 22).catch(() => {})
    if (!logs) return
    console.log(logs)
    const log = logs.entries.find(e => e.targetID === user.id)
    if (!log) return
    if (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime() > 3000) return
    const perp = log.user
    if (log.reason) guildBanAddEvent.embed.fields[1].value = log.reason
    guildBanAddEvent.embed.fields[2].value = `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${perp.id}\`\`\``
    guildBanAddEvent.embed.footer = {
      text: `${perp.username}#${perp.discriminator}`,
      icon_url: perp.avatarURL
    }
    await send(guildBanAddEvent)
  }
}

const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildBanRemove',
  type: 'on',
  handle: async (guild, user) => {
    if (!guild.members.get(global.bot.user.id).permission.json['viewAuditLogs'] || !guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) return
    const guildBanRemoveEvent = {
      guildID: guild.id,
      eventName: 'guildBanRemove',
      embed: {
        author: {
          name: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        },
        description: `${user.username}#${user.discriminator} was unbanned`,
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
    await setTimeout(async () => {
      const logs = await guild.getAuditLogs(1, null, 23).catch(() => {return})
      if (!logs) return
      const log = logs.entries[0]
      const perp = logs.users.find(u => u.id !== user.id)
      if (Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
        if (log.reason) guildBanRemoveEvent.embed.fields[1].value = log.reason
        guildBanRemoveEvent.embed.fields[2].value = `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${perp.id}\`\`\``
        guildBanRemoveEvent.embed.footer = {
          text: `${perp.username}#${perp.discriminator}`,
          icon_url: perp.avatarURL
        }
        await send(guildBanRemoveEvent)
      } else {
        await send(guildBanRemoveEvent)
      }
    }, 1000)
  }
}

const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildRoleDelete',
  type: 'on',
  handle: async (guild, role) => {
    const botPermissions = Object.keys(guild.members.get(global.bot.user.id).permissions.json)
    if (!botPermissions.includes('viewAuditLogs') || !botPermissions.includes('manageWebhooks')) return
    const guildRoleDeleteEvent = {
      guildID: guild.id,
      eventName: 'guildRoleDelete',
      embed: {
        description: 'A role was deleted',
        fields: [
          {
            name: 'Name',
            value: role.name
          }, {
            name: 'Reason',
            value: 'None.'
          }, {
            name: 'ID',
            value: `\`\`\`ini\nRole = ${role.id}\nPerpetrator = Deletion upon member leaving\`\`\``
          }],
        color: role.color ? role.color : 3553599
      }
    }
    const logs = await guild.getAuditLogs(5, null, 32).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === role.id)
    if (!log) return
    const perp = log.user
    if (log && (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime()) < 3000) {
      if (log.reason) guildRoleDeleteEvent.embed.fields[1].value = log.reason
      guildRoleDeleteEvent.embed.fields[2].value = `\`\`\`ini\nRole = ${role.id}\nPerpetrator = ${perp.id}\`\`\``
      guildRoleDeleteEvent.embed.author = {
        name: `${perp.username}#${perp.discriminator}`,
        icon_url: perp.avatarURL
      }
      await send(guildRoleDeleteEvent)
    } else {
      await send(guildRoleDeleteEvent)
    }
  }
}

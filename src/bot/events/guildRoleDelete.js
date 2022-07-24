const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildRoleDelete',
  type: 'on',
  handle: async (guild, role) => {
    const guildRoleDeleteEvent = {
      guildID: guild.id,
      eventName: 'guildRoleDelete',
      embeds: [{
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
      }]
    }
    const logs = await guild.getAuditLog({ limit: 5, actionType: 32 }).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === role.id && (new Date().getTime() - new Date((e.id / 4194304) + 1420070400000).getTime()) < 3000)
    if (log) {
      const perp = log.user
      if (log.reason) guildRoleDeleteEvent.embeds[0].fields[1].value = log.reason
      guildRoleDeleteEvent.embeds[0].fields[2].value = `\`\`\`ini\nRole = ${role.id}\nPerpetrator = ${perp.id}\`\`\``
      guildRoleDeleteEvent.embeds[0].author = {
        name: `${perp.username}#${perp.discriminator}`,
        icon_url: perp.avatarURL
      }
      await send(guildRoleDeleteEvent)
    } else {
      await send(guildRoleDeleteEvent)
    }
  }
}

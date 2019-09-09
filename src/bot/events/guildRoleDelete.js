const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildRoleDelete',
  type: 'on',
  handle: async (guild, role) => {
    const botPermissions = Object.keys(guild.members.get(global.bot.user.id).permission.json)
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
            },{
            name: 'Reason',
            value: 'None.'
          }, {
            name: 'ID',
            value: `\`\`\`ini\nRole = ${role.id}\nPerpetrator = Deletion upon member leaving\`\`\``
          }],
          color: role.color ? role.color : 3553599
        },
      }
      await setTimeout(async () => {
        const logs = await guild.getAuditLogs(1, null, 32).catch(() => {return})
        if (!logs) return
        const log = logs.entries[0]
        const perp = logs.users[0]
        if (log && Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) {
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
      }, 1000)
  }
}

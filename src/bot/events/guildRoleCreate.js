const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildRoleCreate',
  type: 'on',
  handle: async (guild, role) => {
    const guildRoleCreateEvent = {
        guildID: guild.id,
        eventName: 'guildRoleCreate',
        embed: {
          description: 'A role was created ',
          fields: [{
            name: 'Reason',
            value: 'None.'
          }, {
            name: 'ID',
            value: `\`\`\`ini\nRole = ${role.id}\nPerpetrator = Unknown\`\`\``
          }]
        }
      }
      if (!guild.members.find(m => m.username === role.name)) { // if this isn't an auto role
      await setTimeout(async () => {
        const logs = await guild.getAuditLogs(1, null, 30)
        const log = logs.entries[0]
        const perp = logs.users[0]
        if (Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) {
          if (log.reason) guildRoleCreateEvent.embed.fields[0].value = log.reason
          guildRoleCreateEvent.embed.fields[1].value = `\`\`\`ini\nRole = ${role.id}\nPerpetrator = ${perp.id}\`\`\``
          guildRoleCreateEvent.embed.footer = {
            text: `${perp.username}#${perp.discriminator}`,
            icon_url: perp.avatarURL
          }
          await send(guildRoleCreateEvent)
        } else {
          await send(guildRoleCreateEvent)
        }
      }, 1000)
      } else {
          guildRoleCreateEvent.embed.fields[1] = {
            name: 'ID',
            value: `\`\`\`ini\nRole = ${role.id}\nPerpetrator = Automatically created by invite\`\`\``
          }
      }
  }
}

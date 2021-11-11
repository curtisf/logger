const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildRoleCreate',
  type: 'on',
  handle: async (guild, role) => {
    const guildRoleCreateEvent = {
      guildID: guild.id,
      eventName: 'guildRoleCreate',
      embeds: [{
        description: 'A role was created ',
        fields: [{
          name: 'Name',
          value: role.name
        }, {
          name: 'Type',
          value: 'User'
        }, {
          name: 'ID',
          value: `\`\`\`ini\nRole = ${role.id}\nPerpetrator = Unknown\`\`\``
        }]
      }]
    }
    if (!guild.members.find(m => m.username === role.name)) { // if this isn't an auto role
      if (role.managed && role.tags.bot_id && guild.members.find(m => m.username === role.name)) {
        guildRoleCreateEvent.embeds[0].fields[1].value = 'Bot'
      }
      const logs = await guild.getAuditLog({ limit: 5, actionType: 30 }).catch(() => {})
      if (!logs) return
      const log = logs.entries.find(e => e.targetID === role.id && (new Date().getTime() - new Date((e.id / 4194304) + 1420070400000).getTime()) < 3000)
      if (log) {
        const perp = log.user
        if (!perp) return await send(guildRoleCreateEvent)
        if (log.reason) guildRoleCreateEvent.embeds[0].fields[1].value = log.reason
        guildRoleCreateEvent.embeds[0].fields[2].value = `\`\`\`ini\nRole = ${role.id}\nPerpetrator = ${perp.id}\`\`\``
        guildRoleCreateEvent.embeds[0].author = {
          name: `${perp.username}#${perp.discriminator}`,
          icon_url: perp.avatarURL
        }
        await send(guildRoleCreateEvent)
      } else {
        await send(guildRoleCreateEvent)
      }
    } else {
      guildRoleCreateEvent.embeds[0].fields[1] = {
        name: 'ID',
        value: `\`\`\`ini\nRole = ${role.id}\nPerpetrator = Automatically created by invite\`\`\``
      }
    }
  }
}

const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildRoleUpdate',
  type: 'on',
  handle: async (guild, role, oldRole) => {
    const botPermissions = Object.keys(guild.members.get(global.bot.user.id).permissions.json)
    if (!botPermissions.includes('viewAuditLogs') || !botPermissions.includes('manageWebhooks')) return
    const guildRoleUpdateEvent = {
      guildID: guild.id,
      eventName: 'guildRoleUpdate',
      embed: {
        description: 'A role was updated',
        fields: [],
        color: role.color ? role.color : 3553599
      }
    }
    const oldKeys = Object.keys(oldRole)
    oldKeys.forEach(prop => {
      if (role[prop].toString() !== oldRole[prop].toString() && prop !== 'position') {
        if (prop === 'color') {
          guildRoleUpdateEvent.embed.fields.unshift({
            name: toTitleCase(prop),
            value: `Now: ${intToHex(role[prop])}\nWas: ${intToHex(oldRole[prop])}`
          })
        } else {
          guildRoleUpdateEvent.embed.fields.unshift({
            name: toTitleCase(prop),
            value: `Now: ${role[prop]}\nWas: ${oldRole[prop]}`
          })
        }
      }
    })
    if (guildRoleUpdateEvent.embed.fields.length === 0) return // dunno what changed
    const logs = await guild.getAuditLogs(1, null, 31).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === role.id)
    if (!log) {
      return await send(guildRoleUpdateEvent) // just send the embed and stop there.
    }
    if (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime() > 3000) return
    const perp = log.user
    guildRoleUpdateEvent.embed.fields.push({
      name: 'ID',
      value: `\`\`\`ini\nRole = ${role.id}\nPerpetrator = ${perp.id}\`\`\``
    })
    guildRoleUpdateEvent.embed.author = {
      name: `${perp.username}#${perp.discriminator}`,
      icon_url: perp.avatarURL
    }
    if (guildRoleUpdateEvent.embed.fields.length === 1) return
    await send(guildRoleUpdateEvent)
  }
}

function intToHex (num) {
  num >>>= 0
  const b = num & 0xFF
  const g = (num & 0xFF00) >>> 8
  const r = (num & 0xFF0000) >>> 16
  return rgbToHex(r, g, b)
}

function toTitleCase (str) {
  return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() })
}

function rgbToHex (r, g, b) { // bitwise math is black magic
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

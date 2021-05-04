const send = require('../modules/webhooksender')
const CHANNEL_TYPE_MAP = {
  0: 'Text channel',
  2: 'Voice channel',
  4: 'Category',
  5: 'Announcement'
}

module.exports = {
  name: 'channelDelete',
  type: 'on',
  handle: async channel => {
    if (channel.type === 1 || channel.type === 3) return
    const channelDeleteEvent = {
      guildID: channel.guild.id,
      eventName: 'channelDelete',
      embed: {
        author: {
          name: 'Unknown User',
          icon_url: 'https://logger.bot/staticfiles/red-x.png'
        },
        description: `${CHANNEL_TYPE_MAP[channel.type] ? CHANNEL_TYPE_MAP[channel.type] : 'Unsupported channel type'} deleted (${channel.name})`,
        fields: [{
          name: 'Name',
          value: channel.name
        }, {
          name: 'Creation date',
          value: new Date(channel.createdAt).toUTCString()
        },
        {
          name: 'Position',
          value: channel.position
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = Unknown\nChannel = ${channel.id}\`\`\``
        }],
        color: 3553599
      }
    }
    if (channel.permissionOverwrites.size !== 0) {
      channel.permissionOverwrites.forEach(overwrite => {
        if (overwrite.type === 'role') { // Should only be role anyways, but let's just be safe
          const role = channel.guild.roles.find(r => r.id === overwrite.id)
          if (role.name === '@everyone') return
          channelDeleteEvent.embed.fields.push({
            name: role.name,
            value: `Type: role\nPermissions: ${Object.keys(overwrite.json).filter(perm => overwrite.json[perm]).join(', ')}`
          })
        }
      })
    }
    const logs = await channel.guild.getAuditLogs(5, null, 12).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === channel.id)
    if (!log) return
    const user = log.user
    if (user.bot && !global.bot.guildSettingsCache[channel.guild.id].isLogBots()) return
    const member = channel.guild.members.get(user.id)
    if (Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
      channelDeleteEvent.embed.author.name = `${user.username}#${user.discriminator} ${member && member.nick ? `(${member.nick})` : ''}`
      channelDeleteEvent.embed.author.icon_url = user.avatarURL
      channelDeleteEvent.embed.fields[3].value = `\`\`\`ini\nUser = ${user.id}\nChannel = ${channel.id}\`\`\``
      await send(channelDeleteEvent)
    } else {
      await send(channelDeleteEvent)
    }
  }
}

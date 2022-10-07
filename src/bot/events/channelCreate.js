const send = require('../modules/webhooksender')
const CHANNEL_TYPE_MAP = {
  0: 'Text channel',
  2: 'Voice channel',
  4: 'Category channel',
  5: 'Announcement channel',
  13: 'Stage channel',
  15: 'Forum channel'
}

module.exports = {
  name: 'channelCreate',
  type: 'on',
  handle: async newChannel => { // If it's a DM or group channel, ignore the creation
    if (newChannel.type === 1 || newChannel.type === 3) return
    const channelCreateEvent = {
      guildID: newChannel.guild.id,
      eventName: 'channelCreate',
      embeds: [{
        author: {
          name: 'Unknown User',
          icon_url: 'https://logger.bot/staticfiles/red-x.png'
        },
        description: `${CHANNEL_TYPE_MAP[newChannel.type] ? CHANNEL_TYPE_MAP[newChannel.type] : 'Unsupported channel type'} created <#${newChannel.id}>`,
        fields: [{
          name: 'Name',
          value: newChannel.name
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = Unknown\nChannel = ${newChannel.id}\`\`\``
        }],
        color: 3553599
      }]
    }
    if (newChannel.permissionOverwrites.size !== 0) {
      newChannel.permissionOverwrites.forEach(overwrite => {
        if (overwrite.type === 0) { // Should only be role anyways, but let's just be safe
          const role = newChannel.guild.roles.find(r => r.id === overwrite.id)
          if (!role || role.name === '@everyone') return
          channelCreateEvent.embeds[0].fields.push({
            name: role.name,
            value: `Type: role\nPermissions: ${Object.keys(overwrite.json).filter(perm => overwrite.json[perm]).join(', ')}`
          })
        }
      })
    }
    const logs = await newChannel.guild.getAuditLog({ actionType: 10, limit: 10 }).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === newChannel.id && (new Date().getTime() - new Date((e.id / 4194304) + 1420070400000).getTime() < 3000))
    if (!log) return
    const user = log.user
    if (user && user?.bot && !global.bot.guildSettingsCache[newChannel.guild.id].isLogBots()) return
    if (user) {
      const member = newChannel.guild.members.get(user.id)
      channelCreateEvent.embeds[0].author.name = `${user.username}#${user.discriminator} ${member && member.nick ? `(${member.nick})` : ''}`
      channelCreateEvent.embeds[0].author.icon_url = user.avatarURL
      channelCreateEvent.embeds[0].fields[1].value = `\`\`\`ini\nUser = ${user.id}\nChannel = ${newChannel.id}\`\`\``
    }
    await send(channelCreateEvent)
  }
}

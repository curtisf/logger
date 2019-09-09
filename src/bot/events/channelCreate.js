const send = require('../modules/webhooksender')
const CHANNEL_TYPE_MAP = {
  0: 'Text channel',
  2: 'Voice channel',
  4: 'Category'
}

module.exports = {
  name: 'channelCreate',
  type: 'on',
  handle: async newChannel => { // If it's a DM or group channel, ignore the creation
    if (newChannel.type === 1 || newChannel.type === 3 || !newChannel.guild.members.get(global.bot.user.id).permission.json['viewAuditLogs'] || !newChannel.guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) return
    const channelCreateEvent = {
      guildID: newChannel.guild.id,
      eventName: 'channelCreate',
      embed: {
        author: {
          name: 'Unknown User',
          icon_url: 'http://laoblogger.com/images/outlook-clipart-red-x-10.jpg'
        },
        description: `${CHANNEL_TYPE_MAP[newChannel.type]} created <#${newChannel.id}>`,
        fields: [{
          name: 'Name',
          value: newChannel.name
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = Unknown\nChannel = ${newChannel.id}\`\`\``
        }],
        color: 3553599
      }
    }
    if (newChannel.permissionOverwrites.size !== 0) {
      newChannel.permissionOverwrites.forEach(overwrite => {
        if (overwrite.type === 'role') { // Should only be role anyways, but let's just be safe
          const role = newChannel.guild.roles.find(r => r.id === overwrite.id)
          if (role.name === '@everyone') return
          channelCreateEvent.embed.fields.push({
            name: role.name,
            value: `Type: role\nPermissions: ${Object.keys(overwrite.json).filter(perm => overwrite.json[perm]).join(', ')}`
          })
        }
      })
    }
    await setTimeout(async () => {
      const logs = await newChannel.guild.getAuditLogs(1, null, 10).catch(() => {return})
      if (!logs) return
      const log = logs.entries[0]
      const user = logs.users[0]
      const member = newChannel.guild.members.get(user.id)
      if (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime() < 3000) { // if the audit log is less than 3 seconds off
        channelCreateEvent.embed.author.name = `${user.username}#${user.discriminator} ${member.nick ? `(${member.nick})` : ''}`
        channelCreateEvent.embed.author.icon_url = user.avatarURL
        channelCreateEvent.embed.fields[1].value = `\`\`\`ini\nUser = ${user.id}\nChannel = ${newChannel.id}\`\`\``
        await send(channelCreateEvent)
      } else {
        await send(channelCreateEvent)
      }
    }, 1000)
  }
}

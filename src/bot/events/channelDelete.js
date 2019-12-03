const send = require('../modules/webhooksender')
const CHANNEL_TYPE_MAP = {
  0: 'Text channel',
  2: 'Voice channel',
  4: 'Category'
}

module.exports = {
  name: 'channelDelete',
  type: 'on',
  handle: async channel => {
    if (channel.type === 1 || channel.type === 3 || !channel.guild.members.get(global.bot.user.id).permission.json['viewAuditLogs'] || !channel.guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) return
    const channelDeleteEvent = {
      guildID: channel.guild.id,
      eventName: 'channelDelete',
      embed: {
        author: {
          name: 'Unknown User',
          icon_url: 'http://laoblogger.com/images/outlook-clipart-red-x-10.jpg'
        },
        description: `${CHANNEL_TYPE_MAP[channel.type]} deleted (${channel.name})`,
        fields: [{
          name: 'Name',
          value: channel.name
        }, {
          name: 'Creation date',
          value: new Date(channel.createdAt).toString()
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
    let lastCachedMessage = await global.redis.get(channel.lastMessageID)
    if (lastCachedMessage) {
      lastCachedMessage = JSON.parse(lastCachedMessage)
      const user = global.bot.users.get(lastCachedMessage.userID)
      channelDeleteEvent.embed.fields.push({
        name: 'Last message',
        value: `Author: **${user.username}#${user.discriminator}**\n${lastCachedMessage.content}`
      })
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
    await setTimeout(async () => {
      const logs = await channel.guild.getAuditLogs(1, null, 12).catch(() => {return})
      if (!logs) return
      const log = logs.entries[0]
      const user = logs.users[0]
      const member = channel.guild.members.get(user.id)
      if (Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
        channelDeleteEvent.embed.author.name = `${user.username}#${user.discriminator} ${member.nick ? `(${member.nick})` : ''}`
        channelDeleteEvent.embed.author.icon_url = user.avatarURL
        channelDeleteEvent.embed.fields[3].value = `\`\`\`ini\nUser = ${user.id}\nChannel = ${channel.id}\`\`\``
        await send(channelDeleteEvent)
      } else {
        await send(channelDeleteEvent)
      }
    }, 1000)
  }
}

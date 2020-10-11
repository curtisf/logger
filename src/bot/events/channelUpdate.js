const send = require('../modules/webhooksender')
const CHANNEL_TYPE_MAP = {
  0: 'Text channel',
  2: 'Voice channel',
  4: 'Category',
  5: 'Announcement'
}

module.exports = {
  name: 'channelUpdate',
  type: 'on',
  handle: async (channel, oldChannel) => { // ignore updates of dm and group channels
    if (channel.type === 1 || channel.type === 3 || !channel.guild.members.get(global.bot.user.id).permissions.json.viewAuditLogs || !channel.guild.members.get(global.bot.user.id).permissions.json.manageWebhooks) return
    if (channel.position !== oldChannel.position) return
    if (global.bot.guildSettingsCache[channel.guild.id].isChannelIgnored(channel.id)) return
    const channelUpdateEvent = {
      guildID: channel.guild.id,
      eventName: 'channelUpdate',
      embed: {
        author: {
          name: 'Unknown User',
          icon_url: 'https://logger.bot/staticfiles/red-x.png'
        },
        description: `${CHANNEL_TYPE_MAP[channel.type] ? CHANNEL_TYPE_MAP[channel.type] : 'Unsupported channel type'} was updated (${channel.name})`,
        fields: [{
          name: 'Name',
          value: channel.name
        }, {
          name: 'Creation date',
          value: new Date((channel.id / 4194304) + 1420070400000).toUTCString()
        },
        {
          name: 'Position',
          value: channel.position
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = Unknown\nChannel = ${channel.id}\`\`\``
        }]
      }
    }
    if (channel.name !== oldChannel.name) channelUpdateEvent.embed.fields.push({ name: 'Name', value: `**Now**: ${channel.name}\n\n**Was**: ${oldChannel.name}` })
    if (channel.nsfw !== oldChannel.nsfw) channelUpdateEvent.embed.fields.push({ name: 'NSFW', value: `Now: ${channel.nsfw ? 'NSFW warning enabled' : 'NSFW warning disabled'}\nWas: ${oldChannel.nsfw ? 'NSFW warning enabled' : 'NSFW warning disabled'}` })
    if (channel.topic !== oldChannel.topic) channelUpdateEvent.embed.fields.push({ name: 'Topic', value: `Now: ${channel.topic ? channel.topic.substr(0, 400) : 'Empty'}\nWas: ${oldChannel.topic ? oldChannel.topic.substr(0, 400) : 'Empty'}` })
    if (channel.bitrate && (channel.bitrate !== oldChannel.bitrate)) channelUpdateEvent.embed.fields.push({ name: 'Bitrate', value: `Now: ${channel.bitrate}\nWas: ${oldChannel.bitrate}` })
    let channelOverwrites = channel.permissionOverwrites.map(o => o) // convert to array
    let oldOverwrites = oldChannel.permissionOverwrites.map(o => o)
    let uniques = getDifference(channelOverwrites, oldOverwrites)
    if (oldOverwrites.length > channelOverwrites.length) {
      uniques = getDifference(oldOverwrites, channelOverwrites)
    }
    let auditLogId
    if (channelOverwrites.length > oldOverwrites.length) {
      auditLogId = 13
      channelOverwrites = channelOverwrites.filter(val => !uniques.includes(val))
    } else if (oldOverwrites.length > channelOverwrites.length) {
      auditLogId = 15
      oldOverwrites = oldOverwrites.filter(val => !uniques.includes(val))
    } else if (channel.topic !== oldChannel.topic || channel.nsfw !== oldChannel.nsfw || channel.name !== oldChannel.name) {
      auditLogId = 11
    } else auditLogId = 14
    channelOverwrites.forEach(newOverwrite => {
      const oldOverwrite = oldOverwrites.find(ow => ow.id === newOverwrite.id)
      if (!newOverwrite || !oldOverwrite) return
      const newPerms = Object.keys(newOverwrite.json)
      const oldPerms = Object.keys(oldOverwrite.json)
      let differentPerms = getDifference(newPerms, oldPerms)
      if (oldPerms.length > newPerms.length) differentPerms = getDifference(oldPerms, newPerms)
      if (channel.permissionOverwrites.map(o => `${o.allow}|${o.deny}`).toString() === oldChannel.permissionOverwrites.map(o => `${o.allow}|${o.deny}`).toString()) return
      let overwriteName = newOverwrite.type + ' '
      if (newOverwrite.type === 'member') {
        const member = channel.guild.members.get(newOverwrite.id)
        if (member) {
          overwriteName += member.username + member.nick ? `(${member.mention})` : ''
        }
      } else {
        const role = channel.guild.roles.find(r => r.id === newOverwrite.id)
        overwriteName += role.name
        if (role.color) channelUpdateEvent.embed.color = role.color
      }
      const field = {
        name: overwriteName,
        value: ''
      }
      differentPerms.forEach(perm => { // This is black magic, but tl;dr it determines whether a perm was set to grant/deny/inherit
        if (newOverwrite.json.hasOwnProperty(perm) && oldOverwrite.json.hasOwnProperty(perm)) {
          if (newOverwrite.json[perm] === true && oldOverwrite.json[perm] === false) {
            field.value += `\nALLOW ${perm}`
          } else if (newOverwrite.json[perm] === false && oldOverwrite.json[perm] === true) {
            field.value += `\nDENY ${perm}`
          }
        } else if (newOverwrite.json.hasOwnProperty(perm) && !oldOverwrite.json.hasOwnProperty(perm)) {
          if (newOverwrite.json[perm]) {
            field.value += `\nALLOW ${perm}`
          } else {
            field.value += `\nDENY ${perm}`
          }
        } else if (!newOverwrite.json.hasOwnProperty(perm) && oldOverwrite.json.hasOwnProperty(perm)) {
          field.value += `\n⚖️ neutral/inherit ${perm}`
        }
      })
      if (field.value) {
        if (newOverwrite.type === 'member') field.value = `<@${newOverwrite.id}>` + field.value
        channelUpdateEvent.embed.fields.push(field)
      }
    })
    const logs = await channel.guild.getAuditLogs(5, null, auditLogId).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === channel.id)
    if (!log) return
    const user = log.user
    if (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime() < 3000) { // if the audit log is less than 3 seconds off
      channelUpdateEvent.embed.author.name = `${user.username}#${user.discriminator}`
      channelUpdateEvent.embed.author.icon_url = user.avatarURL
      channelUpdateEvent.embed.fields[3].value = `\`\`\`ini\nUser = ${user.id}\nChannel = ${channel.id}\`\`\``
      await send(channelUpdateEvent)
    } else {
      await send(channelUpdateEvent)
    }
  }
}

function getDifference (array1, array2) {
  return array1.filter(i => {
    return array2.indexOf(i) < 0
  })
}

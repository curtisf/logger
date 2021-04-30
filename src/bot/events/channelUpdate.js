const { Permission } = require('eris')
const send = require('../modules/webhooksender')
const escape = require('markdown-escape')
const CHANNEL_TYPE_MAP = {
  0: 'Text Channel',
  2: 'Voice Channel',
  4: 'Category Channel',
  5: 'Announcement Channel',
  13: 'Stage Channel'
}

// this is guild-wide because this module has no idea of the perms that the log channel posesses
const canUseExternal = guild => guild.roles.get(guild.id).permissions.json.useExternalEmojis

module.exports = {
  name: 'channelUpdate',
  type: 'on',
  handle: async (channel, oldChannel) => { // ignore updates of dm and group channels
    if (channel.type === 1 || channel.type === 3) return
    if (channel.position !== oldChannel.position) return // flawed logic
    if (global.bot.guildSettingsCache[channel.guild.id].isChannelIgnored(channel.id)) return
    const channelUpdateEvent = {
      guildID: channel.guild.id,
      eventName: 'channelUpdate',
      embed: {
        author: {
          name: 'Unknown User',
          icon_url: 'https://logger.bot/staticfiles/red-x.png'
        },
        color: 0x03d3fc,
        description: `${CHANNEL_TYPE_MAP[channel.type] ? CHANNEL_TYPE_MAP[channel.type] : 'Unsupported channel type'} was updated (${channel.name})`,
        fields: [{
          name: 'Creation date',
          value: global.bot.guildSettingsCache[channel.guild.id].makeFormattedTime(channel.createdAt),
          inline: true
        }]
      }
    }
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
    } else if (channel.topic !== oldChannel.topic || channel.nsfw !== oldChannel.nsfw || channel.name !== oldChannel.name || channel.rateLimitPerUser !== oldChannel.rateLimitPerUser || channel.rtcRegion !== oldChannel.rtcRegion || channel.videoQualityMode !== oldChannel.videoQualityMode || channel.userLimit !== oldChannel.userLimit) {
      auditLogId = 11
    } else auditLogId = 14

    const logs = await channel.guild.getAuditLogs(1, null, auditLogId).catch(() => {})
    if (!logs) return
    const log = logs.entries.find(e => e.targetID === channel.id)
    if (!log) return // there should always be an audit log
    const user = log?.user
    if (user?.bot && !global.bot.guildSettingsCache[channel.guild.id].isLogBots()) return
    if (auditLogId === 11) {
      const toIter = Object.keys(log.before).length >= Object.keys(log.after).length ? log.before : log.after
      for (const changedKey in toIter) {
        if (changedKey === 'topic') {
          let newTopic = '<no topic set>'
          let oldTopic = '<no topic set>'
          if (channel.topic !== null && channel.topic.trim()) {
            newTopic = escape(channel.topic.replace(/~/g, '\\~'), ['angle brackets'])
          }
          if (oldChannel.topic !== null && oldChannel.topic.trim()) {
            oldTopic = escape(oldChannel.topic.replace(/~/g, '\\~'), ['angle brackets'])
          }
          if (newTopic === oldTopic) {
            channelUpdateEvent.embed.fields.push({
              name: 'Topic',
              value: '<no topic set>'
            })
          } else {
            channelUpdateEvent.embed.fields.push({
              name: 'Topic',
              value: `Now: \`${newTopic}\`\nWas: \`${oldTopic}\``
            })
          }
          // using `` to surround topic because topic can be just spaces
          continue
        }
        const changes = transformAuditLogEntry(changedKey, log.before[changedKey], log.after[changedKey])
        channelUpdateEvent.embed.fields.push({
          name: toTitleCase(changedKey),
          value: `Now: ${changes.after}\nWas: ${changes.before}`
        })
      }
    } else {
      if (Object.keys(log.after).length !== 0 && Object.keys(log.before).length === 0) {
        channelUpdateEvent.embed.fields.push({
          name: 'Overwrite Created',
          value: `For: \`${log.after.type === 0 ? `role ${channel.guild.roles.get(log.after.id).name}` : `member <@${log.after.id}>`}\``
        })
        if (log.after.type === 0) {
          const role = channel.guild.roles.get(log.after.id)
          channelUpdateEvent.embed.color = role.color || 0x03d3fc
        }
      } else if (Object.keys(log.before).length !== 0 && Object.keys(log.after).length === 0) {
        channelUpdateEvent.embed.fields.push({
          name: 'Overwrite Removed',
          value: `For: \`${log.before.type === 0 ? `role ${channel.guild.roles.get(log.before.id).name}` : `member <@${log.before.id}>`}\``
        })
        if (log.before.type === 0) {
          const role = channel.guild.roles.get(log.before.id)
          channelUpdateEvent.embed.color = role.color || 0x03d3fc
        }
      } else {
        channelOverwrites.forEach(newOverwrite => {
          const oldOverwrite = oldOverwrites.find(ow => ow.id === newOverwrite.id)
          if (!newOverwrite || !oldOverwrite) return
          const newPerms = Object.keys(newOverwrite.json)
          const oldPerms = Object.keys(oldOverwrite.json)
          const differentPerms = (newPerms.length >= oldPerms.length ? newPerms.concat(getDifference(newPerms, oldPerms)) : oldPerms.concat(oldPerms, newPerms)).filter((v, i, self) => self.indexOf(v) === i)
          if (channel.permissionOverwrites.map(o => `${o.allow}|${o.deny}`).toString() === oldChannel.permissionOverwrites.map(o => `${o.allow}|${o.deny}`).toString()) return
          let overwriteName = newOverwrite.type + ' '
          if (newOverwrite.type === 'member') {
            const member = channel.guild.members.get(newOverwrite.id)
            if (member) {
              overwriteName += member.username + member.nick ? `(${member.mention})` : ''
            }
          } else if (newOverwrite.type === 'role') {
            const role = channel.guild.roles.find(r => r.id === newOverwrite.id)
            if (!role) return
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
                field.value += `\n${canUseExternal(channel.guild) ? '<:onswitch:827651433750855710>' : 'ALLOW'} ${perm}`
              } else if (newOverwrite.json[perm] === false && oldOverwrite.json[perm] === true) {
                field.value += `\n${canUseExternal(channel.guild) ? '<:offswitch:827651237293981736>' : 'DENY'} ${perm}`
              }
            } else if (newOverwrite.json.hasOwnProperty(perm) && !oldOverwrite.json.hasOwnProperty(perm)) {
              if (newOverwrite.json[perm]) {
                field.value += `\n${canUseExternal(channel.guild) ? '<:onswitch:827651433750855710>' : 'ALLOW'} ${perm}`
              } else {
                field.value += `\n${canUseExternal(channel.guild) ? '<:offswitch:827651237293981736>' : 'DENY'} ${perm}`
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
      }
    }

    if (log && user) {
      channelUpdateEvent.embed.author.name = `${user.username}#${user.discriminator}`
      channelUpdateEvent.embed.author.icon_url = user.avatarURL
      if (channel.type === 13) {
        channelUpdateEvent.embed.description = `Stage Channel **${channel.name}** was ${channel.topic === null ? 'closed' : 'opened'}`
      }
      channelUpdateEvent.embed.fields.push({ name: 'ID', value: `\`\`\`ini\nUser = ${user.id}\nChannel = ${channel.id}\`\`\`` })
      await send(channelUpdateEvent)
    } else {
      channelUpdateEvent.embed.fields.push({
        name: 'ID',
        value: `\`\`\`ini\nUser = Unknown, no audit log entry\nChannel = ${channel.id}\`\`\``
      })
      await send(channelUpdateEvent)
    }
  }
}

function toTitleCase (str) {
  return str.replace(/_/g, ' ').replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase() })
}

function getDifference (array1, array2) {
  return array1.filter(i => {
    return array2.indexOf(i) < 0
  })
}

function transformAuditLogEntry (nameOfKey, before, after) {
  switch (nameOfKey) {
    case 'nsfw': {
      return { before: before ? 'enabled' : 'disabled', after: after ? 'enabled' : 'disabled' }
    }
    case 'topic': {
      return { before: before ? escape(before.replace(/~/g, '\\~'), ['angle brackets']) : '<no topic set>', after: after ? escape(after.replace(/~/g, '\\~'), ['angle brackets']) : '<no topic set>' }
    }
    case 'rate_limit_per_user': {
      return { before: `${before} second(s)`, after: `${after} seconds` }
    }
    case 'name': {
      return { before, after }
    }
    case 'type': {
      return { before: CHANNEL_TYPE_MAP[before], after: CHANNEL_TYPE_MAP[after] }
    }
    case 'bitrate': {
      return { before: `${parseInt(before) / 1000}kbps`, after: `${parseInt(after) / 1000}kbps` }
    }
    case 'rtc_region': {
      return { before: before || 'Automatic', after: after || 'Automatic' }
    }
    case 'video_quality_mode': {
      return { before: before === 1 ? 'Automatic' : '720p', after: after === 1 ? 'Automatic' : '720p' }
    }
    case 'user_limit': {
      return { before: before !== 0 ? before : 'unrestricted', after: after !== 0 ? after : 'unrestricted' }
    }
    default: {
      return { before: '<unknown>', after: '<unknown>' }
    }
  }
}

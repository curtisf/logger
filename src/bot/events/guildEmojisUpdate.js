const send = require('../modules/webhooksender')
const AUDIT_ID = {
  'added': 60,
  'removed': 62,
  'updated': 61
}

module.exports = {
  name: 'guildEmojisUpdate',
  type: 'on',
  handle: async (guild, emojis, oldEmojis) => {
    if (!guild.members.get(global.bot.user.id).permission.json['viewAuditLogs'] || !guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) return
    let type
    const guildEmojisUpdateEvent = {
      guildID: guild.id,
      eventName: 'guildEmojisUpdate',
      embed: {
        description: `Guild emojis were updated.`,
        fields: [{
          name: 'Emoji was manipulated',
          value: ''
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = Unknown\nEmoji = Unknown\`\`\``
        }],
        color: 3553599
      }
    }
    let emoji
    if (emojis.length > oldEmojis.length) {
      const newEmojis = emojis.filter(function (el) {
        if (!oldEmojis.find(e => e.id !== el.id)) {
          return true
        }
      })
      emoji = newEmojis[0]
      if (!emoji) {
        return
      }
      type = 'added'
      guildEmojisUpdateEvent.embed.thumbnail = {
        'url': `https://cdn.discordapp.com/emojis/${emoji.id}.png?v=1`
      }
      guildEmojisUpdateEvent.embed.fields[0].name = 'Added emoji'
      guildEmojisUpdateEvent.embed.fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}`
    } else if (oldEmojis.length > emojis.length) {
      const removedEmojis = oldEmojis.filter(function (el) {
        if (!emojis.find(e => e.id === el.id)) return true
      })
      emoji = removedEmojis[0]
      type = 'removed'
      guildEmojisUpdateEvent.embed.fields[0].name = 'Removed emoji'
      guildEmojisUpdateEvent.embed.fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}`
    } else {
      type = 'updated'
      return
    }
    await setTimeout(async () => {
      const num = AUDIT_ID[type]
      const logs = await guild.getAuditLogs(1, null, num).catch(() => {return})
      if (!logs) return
      const log = logs.entries[0]
      const user = logs.users[0]
      if (Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
        guildEmojisUpdateEvent.embed.author = {
          name: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        }
        guildEmojisUpdateEvent.embed.fields[1].value = `\`\`\`ini\nUser = ${user.id}\nEmoji = ${emoji.id}\`\`\``
        await send(guildEmojisUpdateEvent)
      } else {
        await send(guildEmojisUpdateEvent)
      }
    }, 1000)
  }
}

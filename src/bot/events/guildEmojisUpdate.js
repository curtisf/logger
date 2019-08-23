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
      eventName: 'guildEmojisUpdateEvent',
      embed: {
        description: `Guild emojis were updated.`,
        fields: [{
          name: 'Added or removed emoji',
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
        return oldEmojis.indexOf(el) < 0
      })
      emoji = newEmojis[0]
      type = 'added'
      guildEmojisUpdateEvent.embed.thumbnail = {
        'url': `https://cdn.discordapp.com/emojis/${emoji.id}.png?v=1`
      }
      guildEmojisUpdateEvent.embed.fields[0].value = 'Added emoji'
      guildEmojisUpdateEvent.embed.fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}`
    } else if (oldEmojis.length > emojis.length) {
      const removedEmojis = oldEmojis.filter(function (el) {
        return emojis.indexOf(el) < 0
      })
      emoji = removedEmojis[0]
      type = 'removed'
      guildEmojisUpdateEvent.embed.fields[0].value = 'Removed emoji'
      guildEmojisUpdateEvent.embed.fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}`
    } else {
      type = 'updated'
      return
    }
    await setTimeout(async () => {
      const num = AUDIT_ID[type]
      const logs = await guild.getAuditLogs(1, null, num).catch(() => {return})
      const log = logs.entries[0]
      const user = logs.users[0]
      if (Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
        guildEmojisUpdateEvent.embed.fields[1].value = `\`\`\`ini\nUser = ${user.id}\nEmoji = ${emoji.id}\`\`\``
        await send(guildEmojisUpdateEvent)
      } else {
        await send(guildEmojisUpdateEvent)
      }
    }, 1000)
  }
}

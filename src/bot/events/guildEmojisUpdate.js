const send = require('../modules/webhooksender')
const AUDIT_ID = {
  added: 60,
  removed: 62,
  updated: 61
}

module.exports = {
  name: 'guildEmojisUpdate',
  type: 'on',
  handle: async (guild, emojis, oldEmojis) => {
    let type
    const guildEmojisUpdateEvent = {
      guildID: guild.id,
      eventName: 'guildEmojisUpdate',
      embed: {
        description: 'Guild emojis were updated.',
        fields: [{
          name: 'Emoji was manipulated',
          value: ''
        }, {
          name: 'ID',
          value: '```ini\nUser = Unknown\nEmoji = Unknown```'
        }],
        color: 3553599
      }
    }
    let emoji
    if (emojis.length > oldEmojis.length) {
      const newEmojis = emojis.filter(e => !oldEmojis.find(o => o.id === e.id))
      emoji = newEmojis[0]
      if (!emoji) {
        return
      }
      type = 'added'
      guildEmojisUpdateEvent.embed.thumbnail = {
        url: `https://cdn.discordapp.com/emojis/${emoji.id}.png?v=1`
      }
      guildEmojisUpdateEvent.embed.fields[0].name = 'Added emoji'
      guildEmojisUpdateEvent.embed.fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}\n<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`
    } else if (oldEmojis.length > emojis.length) {
      const removedEmojis = oldEmojis.filter(e => !emojis.find(o => o.id === e.id))
      emoji = removedEmojis[0]
      type = 'removed'
      guildEmojisUpdateEvent.embed.fields[0].name = 'Removed emoji'
      guildEmojisUpdateEvent.embed.fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}`
    } else {
      type = 'updated'
      emoji = emojis.find(e => oldEmojis.find(o => o.id === e.id).name !== e.name)
      if (!emoji) return
      guildEmojisUpdateEvent.embed.fields[0].name = 'Updated emoji'
      guildEmojisUpdateEvent.embed.fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}`
      guildEmojisUpdateEvent.embed.thumbnail = {
        url: `https://cdn.discordapp.com/emojis/${emoji.id}.png?v=1`
      }
      const oldEmoji = oldEmojis.find(o => o.id === emoji.id)
      if (emoji.name !== oldEmoji.name) {
        guildEmojisUpdateEvent.embed.fields[0].value += `\nName was = ${oldEmoji.name}`
      }
    }
    await setTimeout(async () => {
      const num = AUDIT_ID[type]
      const logs = await guild.getAuditLogs(5, null, num).catch(() => {})
      if (!logs) return
      const log = logs.entries.find(e => e?.targetID === emoji.id)
      if (!log) return
      const user = log.user
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

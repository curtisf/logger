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
      embeds: [{
        description: 'Guild emojis were updated.',
        fields: [{
          name: 'Emoji was manipulated',
          value: ''
        }, {
          name: 'ID',
          value: '```ini\nUser = Unknown\nEmoji = Unknown```'
        }],
        color: 3553599
      }]
    }
    let emoji
    if (emojis.length > oldEmojis.length) {
      const newEmojis = emojis.filter(e => !oldEmojis.find(o => o.id === e.id))
      emoji = newEmojis[0]
      if (!emoji) {
        return
      }
      type = 'added'
      guildEmojisUpdateEvent.embeds[0].thumbnail = {
        url: `https://cdn.discordapp.com/emojis/${emoji.id}.png?v=1`
      }
      guildEmojisUpdateEvent.embeds[0].fields[0].name = 'Added emoji'
      guildEmojisUpdateEvent.embeds[0].fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}\n<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`
    } else if (oldEmojis.length > emojis.length) {
      const removedEmojis = oldEmojis.filter(e => !emojis.find(o => o.id === e.id))
      emoji = removedEmojis[0]
      type = 'removed'
      guildEmojisUpdateEvent.embeds[0].fields[0].name = 'Removed emoji'
      guildEmojisUpdateEvent.embeds[0].fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}`
    } else {
      type = 'updated'
      emoji = emojis.find(e => oldEmojis.find(o => o.id === e.id)?.name !== e.name)
      if (!emoji) return
      guildEmojisUpdateEvent.embeds[0].fields[0].name = 'Updated emoji'
      guildEmojisUpdateEvent.embeds[0].fields[0].value = `Name = ${emoji.name}\nManaged = ${emoji.managed ? 'Yes' : 'No'}\nAnimated = ${emoji.animated ? 'Yes' : 'No'}`
      guildEmojisUpdateEvent.embeds[0].thumbnail = {
        url: `https://cdn.discordapp.com/emojis/${emoji.id}.png?v=1`
      }
      const oldEmoji = oldEmojis.find(o => o.id === emoji.id)
      if (!oldEmoji) {
        return
      }
      if (emoji.name !== oldEmoji.name) {
        guildEmojisUpdateEvent.embeds[0].fields[0].value += `\nName was = ${oldEmoji.name}`
      }
    }
    await setTimeout(async () => {
      const num = AUDIT_ID[type]
      const logs = await guild.getAuditLog({ limit: 5, actionType: num }).catch(() => {})
      if (!logs) return
      const log = logs.entries.find(e => e?.targetID === emoji.id && Date.now() - ((e.id / 4194304) + 1420070400000) < 3000)
      if (log && log.user) { // if the audit log is less than 3 seconds off
        const user = log.user
        guildEmojisUpdateEvent.embeds[0].author = {
          name: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        }
        guildEmojisUpdateEvent.embeds[0].fields[1].value = `\`\`\`ini\nUser = ${user.id}\nEmoji = ${emoji.id}\`\`\``
        await send(guildEmojisUpdateEvent)
      }
    }, 1000)
  }
}

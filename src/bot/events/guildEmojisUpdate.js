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
    let type
    let guildEmojisUpdateEvent = {
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
      let newEmojis = emojis.filter(function (el) {
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
      let removedEmojis = oldEmojis.filter(function (el) {
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
      let num = AUDIT_ID[type]
      let logs = await guild.getAuditLogs(1, null, num)
      let log = logs.entries[0]
      let user = logs.users[0]
      if (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime() < 3000) { // if the audit log is less than 3 seconds off
        guildEmojisUpdateEvent.embed.fields[1].value = `\`\`\`ini\nUser = ${user.id}\nEmoji = ${emoji.id}\`\`\``
        await send(guildEmojisUpdateEvent)
      } else {
        await send(guildEmojisUpdateEvent)
      }
    }, 1000)
  }
}

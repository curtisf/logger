const send = require('../modules/webhooksender')
const AUDIT_ID = {
  added: 90,
  removed: 92,
  updated: 91
}

const STICKER_FORMAT_TYPES = {
  1: 'PNG',
  2: 'APNG',
  3: 'LOTTIE',
}

module.exports = {
  name: 'guildStickersUpdate',
  type: 'on',
  handle: async (guild, stickers, oldStickers) => {
    console.log("STICKER UPDATED")
    let type
    const guildStickersUpdateEvent = {
      guildID: guild.id,
      eventName: 'guildStickersUpdate',
      embeds: [{
        description: 'Guild stickers were updated.',
        fields: [{
          name: 'Sticker was manipulated',
          value: ''
        }, {
          name: 'ID',
          value: '```ini\nUser = Unknown\nSticker = Unknown```'
        }],
        color: 3553599
      }]
    }
    let sticker
    if (stickers.length > oldStickers.length) {
      const newStickers = stickers.filter(e => !oldStickers.find(o => o.id === e.id))
      sticker = newStickers[0]
      if (!sticker) {
        return
      }
      type = 'added'
      guildStickersUpdateEvent.embeds[0].thumbnail = {
        url: `https://cdn.discordapp.com/stickers/${sticker.id}.png?v=1`
      }
      guildStickersUpdateEvent.embeds[0].fields[0].name = 'Added sticker'
      guildStickersUpdateEvent.embeds[0].fields[0].value = `Name = ${sticker.name}\nDescription = ${sticker.description}\nFormat = ${STICKER_FORMAT_TYPES[sticker.format_type]}`
    } else if (oldStickers.length > stickers.length) {
      const removedStickers = oldStickers.filter(e => !stickers.find(o => o.id === e.id))
      sticker = removedStickers[0]
      type = 'removed'
      guildStickersUpdateEvent.embeds[0].fields[0].name = 'Removed sticker'
      guildStickersUpdateEvent.embeds[0].fields[0].value = `Name = ${sticker.name}\nDescription = ${sticker.description}\nFormat = ${STICKER_FORMAT_TYPES[sticker.format_type]}`
    } else {
      type = 'updated'
      sticker = stickers.find(e => oldStickers.find(o => o.id === e.id).name !== e.name)
      if (!sticker) return
      guildStickersUpdateEvent.embeds[0].fields[0].name = 'Updated sticker'
      guildStickersUpdateEvent.embeds[0].fields[0].value = `Name = ${sticker.name}\nDescription = ${sticker.description}\nFormat = ${STICKER_FORMAT_TYPES[sticker.format_type]}`
      guildStickersUpdateEvent.embeds[0].thumbnail = {
        url: `https://cdn.discordapp.com/stickers/${sticker.id}.png?v=1`
      }
      const oldSticker = oldStickers.find(o => o.id === sticker.id)
      if (sticker.name !== oldSticker.name) {
        guildStickersUpdateEvent.embeds[0].fields[0].value += `\nName was = ${oldSticker.name}`
      }
      if (sticker.description !== oldSticker.description) {
        guildStickersUpdateEvent.embeds[0].fields[0].value += `\nDescription was = ${oldSticker.description}`
      }
    }
    await setTimeout(async () => {
      const num = AUDIT_ID[type]
      const logs = await guild.getAuditLog({ limit: 5, actionType: num }).catch((err) => {console.log(err)})
      if (!logs) return
      const log = logs.entries.find(e => e?.targetID === sticker.id && Date.now() - ((e.id / 4194304) + 1420070400000) < 3000)
      if (log && log.user) { // if the audit log is less than 3 seconds off
        const user = log.user
        guildStickersUpdateEvent.embeds[0].author = {
          name: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        }
        guildStickersUpdateEvent.embeds[0].fields[1].value = `\`\`\`ini\nUser = ${user.id}\nSticker = ${sticker.id}\`\`\``
      }
      await send(guildStickersUpdateEvent)
    }, 1000)
  }
}

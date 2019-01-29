const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildBanAdd',
  type: 'on',
  handle: async (guild, user) => {
    let guildBanAddEvent = {
      guildID: guild.id,
      eventName: 'guildBanAdd',
      embed: {
        author: {
          name: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        },
        description: `${user.username}#${user.discriminator} was banned`,
        fields: [{
          name: 'User Information',
          value: `${user.username}#${user.discriminator} (${user.id}) ${user.mention} ${user.bot ? '\nIs a bot' : ''}`
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = Unknown\`\`\``
        }],
        color: 3553599
      }
    }
    await setTimeout(async () => {
      let logs = await guild.getAuditLogs(1, null, 22)
      let log = logs.entries[0]
      let perp = logs.users[0]
      if (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime() < 3000) { // if the audit log is less than 3 seconds off
        guildBanAddEvent.embed.fields[1].value = `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${perp.id}\`\`\``
        guildBanAddEvent.embed.footer = {
          text: `${perp.username}#${perp.discriminator}`,
          icon_url: perp.avatarURL
        }
        await send(guildBanAddEvent)
      } else {
        await send(guildBanAddEvent)
      }
    }, 1000)
  }
}

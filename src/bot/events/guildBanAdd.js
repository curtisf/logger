const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildBanAdd',
  type: 'on',
  handle: async (guild, user) => {
    const guildBanAddEvent = {
      guildID: guild.id,
      eventName: 'guildBanAdd',
      embeds: [{
        author: {
          name: `${user.username}#${user.discriminator} `,
          icon_url: user.avatarURL
        },
        description: `${user.username}#${user.discriminator} was banned`,
        fields: [{
          name: 'User Information',
          value: `${user.username}#${user.discriminator} (${user.id}) ${user.mention} ${user.bot ? '\nIs a bot' : ''}`
        }, {
          name: 'Reason',
          value: 'None provided'
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${user.id}\nPerpetrator = Unknown\`\`\``
        }],
        color: 3553599
      }]
    }
    /*
     * Race condition time ladies and gentlemen:
     * Why the 1 second wait from when the event is received vs fetching audit logs?
     * The bot fetches audit logs for the ban entry, but Discord is behind on publishing it.
     * The 1 second wait makes sure the bot gets the new entry on time.
     * Thanks Discord.
    */
    const actionStartedTime = new Date()
    setTimeout(async () => {
      const logs = await guild.getAuditLog({ limit: 10, actionType: 22 }).catch(() => {})
      if (!logs) {
        global.logger.warn(`Guild Ban Add was unable to fetch audit logs in guild ${guild.name} (${guild.id})`)
        return
      }
      const log = logs.entries.find(e => e.targetID === user.id && actionStartedTime.getTime() - new Date((e.id / 4194304) + 1420070400000).getTime() < 60000)
      if (!log) {
        global.logger.warn(`Guild Ban Add on ${guild.name} (${guild.id}) was not able to match a log.`)
        return
      }
      if (!log.user) return
      const perp = log.user
      if (log.reason) guildBanAddEvent.embeds[0].fields[1].value = log.reason
      guildBanAddEvent.embeds[0].fields[2].value = `\`\`\`ini\nUser = ${user.id}\nPerpetrator = ${perp.id}\`\`\``
      guildBanAddEvent.embeds[0].footer = {
        text: `${perp.username}#${perp.discriminator}`,
        icon_url: perp.avatarURL
      }
      await send(guildBanAddEvent)
    }, 5000)
  }
}

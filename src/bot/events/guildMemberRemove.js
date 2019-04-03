const send = require('../modules/webhooksender')
const prunecache = require('../modules/prunecache')

module.exports = {
  name: 'guildMemberRemove',
  type: 'on',
  handle: async (guild, member) => {
    if (!guild.members.get(global.bot.user.id).permission.json['viewAuditLogs']) return
    if (!member.createdAt) {
      member.id = 'Unknown'
      member.username = 'Unknown'
      member.discriminator = 'Unknown'
    }
    await setTimeout(async () => {
      const event = {
        guildID: guild.id,
        eventName: 'guildMemberRemove'
      }
      let logs = await guild.getAuditLogs(1, null, 20)
      let log = logs.entries[0]
      let user = logs.users[1]
      if (!log) return
      if (log && Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
        event.eventName = 'guildMemberKick'
        event.embed = {
          author: {
            name: `${member.username}#${member.discriminator}`,
            icon_url: member.avatarURL
          },
          color: 16711680,
          description: `${member.username}#${member.discriminator} was kicked`,
          fields: [{
            name: 'User Information',
            value: `${member.username}#${member.discriminator} (${member.id}) ${member.mention} ${member.bot ? '\nIs a bot' : ''}`
          }, {
            name: 'Reason',
            value: log.reason
          }, {
            name: 'ID',
            value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${user.id}\`\`\``
          }],
          footer: {
            text: `${user.username}#${user.discriminator}`,
            icon_url: user.avatarURL
          }
        }
        return send(event)
      } else {
        const purgeLogs = await guild.getAuditLogs(1, null, 21)
        purgeLogEntry = purgeLogs.entries[0]
        if (!purgeLogEntry) {
          event.embed = {
            author: {
              name: `${member.username}#${member.discriminator}`,
              icon_url: member.avatarURL
            },
            color: 16711680,
            description: `${member.username}#${member.discriminator} left`,
            fields: [{
              name: 'User Information',
              value: `${member.username}#${member.discriminator} (${member.id}) ${member.mention} ${member.bot ? '\nIs a bot' : ''}`
            }, {
              name: 'ID',
              value: `\`\`\`ini\nUser = ${member.id}\`\`\``
            }]
          }
          return send(event)
        } else if (Date.now() - ((purgeLogEntry.id / 4194304) + 1420070400000) < 30000) { // 30 seconds
          return prunecache.handle(purgeLogEntry.id, guild, member, user) // pass event to module for caching/managing prunes
        }
      }
    }, 1000)
  }
}

const send = require('../modules/webhooksender')
const prunecache = require('../modules/prunecache')

module.exports = {
  name: 'guildMemberRemove',
  type: 'on',
  handle: async (guild, member) => {
    await setTimeout(async () => {
      const event = {
        guildID: guild.id,
        eventName: 'guildMemberRemove'
      }
      let logs = await guild.getAuditLogs(1, null, 20)
      let log = logs.entries[0]
      let user = logs.users[0]
      if (Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
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
            name: 'ID',
            value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${user.id}\`\`\``
          }],
          footer: {
            text: `${user.username}#${user.discriminator}`,
            icon_url: user.avatarURL
          }
        }
        return send(event)
      }
      logs = await guild.getAuditLogs(1, null, 21)
      log = logs.entries[0]
      user = logs.users[0]
      if (Date.now() - ((log.id / 4194304) + 1420070400000) < 10000) { // if the audit log is less than 10 seconds off
        return prunecache.handle(log.id, guild, member, user) // pass event to module for caching/managing prunes
      }
      event.embed = {
        author: {
          name: `${member.username}#${member.discriminator}`,
          icon_url: member.avatarURL
        },
        color: 16711680,
        descriptions: `${member.username}#${member.discriminator} left`,
        fields: [{
          name: 'User Information',
          value: `${member.username}#${member.discriminator} (${member.id}) ${member.mention} ${member.bot ? '\nIs a bot' : ''}`
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = ${member.id}\`\`\``
        }]
      }
      await send(event)
    }, 1000)
  }
}

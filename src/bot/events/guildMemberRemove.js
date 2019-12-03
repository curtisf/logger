const send = require('../modules/webhooksender')
const prunecache = require('../modules/prunecache')
const getUser = require('../../db/interfaces/postgres/read').getUser

module.exports = {
  name: 'guildMemberRemove',
  type: 'on',
  handle: async (guild, member) => {
    if (!guild.members.get(global.bot.user.id).permission.json['viewAuditLogs'] || !guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) return
    if (!member.createdAt) {
      member.id = 'Unknown'
      member.username = 'Unknown'
      member.discriminator = 'Unknown'
    }
    let roles = []
    if (member.roles) {
      member.roles.forEach(roleID => {
        const role = guild.roles.find(r => r.id === roleID)
        if (role) roles.push(role)
      })
    }
    const rolesField = {
      name: 'Roles',
      value: roles.length === 0 ? 'None' : roles.map(r => r.name).join(', ') // No idea why the below line is needed
    }
    if (!rolesField.value) rolesField.value = 'None'
    if (!member.username) { // If they don't have a username, then either the lib is dying or it is a lurker
      return await send({
        guildID: guild.id,
        eventName: 'guildMemberRemove',
        embed: {
          author: {
            name: 'Lurker',
            icon_url: 'https://images.emojiterra.com/twitter/512px/1f440.png' // I'm not worried about using a website url for icon because
            //                                                                   Discord caches the image as to prevent unneccesary load
          },
          description: 'A lurker has left the server'
        }
      })
    }
    await setTimeout(async () => {
      const event = {
        guildID: guild.id,
        eventName: 'guildMemberRemove'
      }
      let logs = await guild.getAuditLogs(1, null, 20).catch(() => {return})
      if (!logs) return
      let log = logs.entries[0]
      if (log && Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // if the audit log is less than 3 seconds off
        const dbUser = await getUser(member.id)
        let user = logs.users.find(u => u.id !== member.id)
        event.eventName = 'guildMemberKick'
        event.embed = {
          author: {
            name: `${member.username}#${member.discriminator} ${member.nick ? `(${member.nick})` : ''}`,
            icon_url: member.avatarURL
          },
          color: 16711680,
          description: `${member.username}#${member.discriminator} ${member.nick ? `(${member.nick})` : ''} was kicked`,
          fields: [{
            name: 'User Information',
            value: `${member.username}#${member.discriminator} (${member.id}) ${member.mention} ${member.bot ? '\nIs a bot' : ''}`
          }, rolesField, {
            name: 'Reason',
            value: log.reason ? log.reason : 'None provided'
          }, {
            name: 'ID',
            value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${user.id}\`\`\``
          }],
          footer: {
            text: `${user.username}#${user.discriminator}`,
            icon_url: user.avatarURL
          }
        }
        if (dbUser.names.includes('placeholder')) {
          dbUser.names.splice(dbUser.names.indexOf('placeholder'), 1)
        }
        if (dbUser.names.length !== 0) {
          event.embed.fields.push({
            name: 'Last Names',
            value: `\`\`\`${dbUser.names.join(', ').substr(0, 1000)}\`\`\``
          })
        }
        return send(event)
      } else {
        const purgeLogs = await guild.getAuditLogs(1, null, 21)
        purgeLogEntry = purgeLogs.entries[0]
        let user = purgeLogs.users[0]
        const dbUser = await getUser(member.id)
        if (!purgeLogEntry || Date.now() - ((purgeLogEntry.id / 4194304) + 1420070400000) > 30000) {
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
            }, rolesField, {
              name: 'ID',
              value: `\`\`\`ini\nUser = ${member.id}\`\`\``
            }]
          }
          if (dbUser.names.includes('placeholder')) {
            dbUser.names.splice(dbUser.names.indexOf('placeholder'), 1)
          }
          if (dbUser.names.length !== 0) {
            event.embed.fields.push({
              name: 'Last Names',
              value: `\`\`\`${dbUser.names.join(', ').substr(0, 1000)}\`\`\``
            })
          }
          return send(event)
        } else if (Date.now() - ((purgeLogEntry.id / 4194304) + 1420070400000) < 30000) { // 30 seconds
          return prunecache.handle(purgeLogEntry.id, guild, member, user) // pass event to module for caching/managing prunes
        }
      }
    }, 1000)
  }
}

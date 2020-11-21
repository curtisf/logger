const send = require('../modules/webhooksender')
const prunecache = require('../modules/prunecache')
const { User } = require('eris')

module.exports = {
  name: 'guildMemberRemove',
  type: 'on',
  handle: async (guild, member) => {
    if (!member.roles) {
      member = new User({ id: member.id, ...member.user }, global.bot)
    }
    if (!guild.members.get(global.bot.user.id).permissions.json.viewAuditLogs || !guild.members.get(global.bot.user.id).permissions.json.manageWebhooks) return
    const roles = []
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
    const event = {
      guildID: guild.id,
      eventName: 'guildMemberRemove'
    }
    const logs = await guild.getAuditLogs(5, null, 20).catch(() => {})
    let log
    if (logs && logs.entries && logs.entries.length !== 0) {
      log = logs.entries.find(e => e.targetID === member.id)
    }
    if (log && Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) {
      const user = log.user
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
        }],
        footer: {
          text: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        }
      }
      if (member.roles) {
        event.embed.fields.push(rolesField, {
          name: 'Joined At',
          value: `${new Date(member.joinedAt).toUTCString()} (${Math.abs(((new Date().getTime() - member.joinedAt) / 1000 / 60 / 60 / 24)).toFixed(0)} days, ${Math.abs(((new Date().getTime() - member.joinedAt) / 1000 / 60 / 60)).toFixed(0)} hours ago)`
        })
      }
      event.embed.fields.push({
        name: 'Created At',
        value: `${new Date(member.createdAt).toUTCString()} (${Math.abs(((new Date().getTime() - member.createdAt) / 1000 / 60 / 60 / 24)).toFixed(0)} days, ${((new Date().getTime() - member.createdAt) / 1000 / 60 / 60).toFixed(0)} hours old)`
      }, {
        name: 'Reason',
        value: log.reason ? log.reason : 'None provided'
      }, {
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${user.id}\`\`\``
      })
      return send(event)
    } else {
      // TODO: redo purge audit log stuff eventually
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
        }]
      }
      if (member.roles) {
        event.embed.fields.push(rolesField, {
          name: 'Joined At',
          value: `${new Date(member.joinedAt).toUTCString()} (${Math.abs(((new Date().getTime() - member.joinedAt) / 1000 / 60 / 60 / 24)).toFixed(0)} days, ${Math.abs(((new Date().getTime() - member.joinedAt) / 1000 / 60 / 60)).toFixed(0)} hours ago)`
        })
      }
      event.embed.fields.push({
        name: 'Created At',
        value: `${new Date(member.createdAt).toUTCString()} (${Math.abs(((new Date().getTime() - member.createdAt) / 1000 / 60 / 60 / 24)).toFixed(0)} days, ${Math.abs(((new Date().getTime() - member.createdAt) / 1000 / 60 / 60)).toFixed(0)} hours old)`
      }, {
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.id}\`\`\``
      })
      return send(event)
    }
  }
}

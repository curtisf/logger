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
    const logs = await guild.getAuditLog({ limit: 5, actionType: 20 }).catch(() => {})
    let log
    if (logs && logs.entries && logs.entries.length !== 0) {
      log = logs.entries.find(e => e.targetID === member.id && (Date.now() - ((e.id / 4194304) + 1420070400000)) < 3000)
    }
    if (log && log.user) {
      const user = log.user
      if (!user) return // !!!! not good
      event.eventName = 'guildMemberKick'
      event.embeds = [{
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
      }]
      if (member.roles) {
        event.embeds[0].fields.push(rolesField, {
          name: 'Joined At',
          value: `<t:${Math.round(member.joinedAt / 1000)}:F> (${Math.abs(((new Date().getTime() - member.joinedAt) / 1000 / 60 / 60 / 24)).toFixed(0)} days, ${Math.abs(((new Date().getTime() - member.joinedAt) / 1000 / 60 / 60)).toFixed(0)} hours ago)`
        })
      }
      event.embeds[0].fields.push({
        name: 'Created At',
        value: `<t:${Math.round(member.createdAt / 1000)}:F> (${Math.abs(((new Date().getTime() - member.createdAt) / 1000 / 60 / 60 / 24)).toFixed(0)} days, ${((new Date().getTime() - member.createdAt) / 1000 / 60 / 60).toFixed(0)} hours old)`
      }, {
        name: 'Reason',
        value: log.reason ? log.reason : 'None provided'
      }, {
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${user.id}\`\`\``
      })
      return send(event)
    } else {
      // TODO: redo purge audit log stuff eventually (update: copy from patron bot eventually)
      event.embeds = [{
        author: {
          name: `${member.username}#${member.discriminator}`,
          icon_url: member.avatarURL
        },
        color: 16711680,
        description: `${member.username}#${member.discriminator} left the server`,
        fields: [{
          name: 'User Information',
          value: `${member.username}#${member.discriminator} (${member.id}) ${member.mention} ${member.bot ? '\nIs a bot' : ''}`
        }]
      }]
      if (member.roles) {
        event.embeds[0].fields.push(rolesField, {
          name: 'Joined At',
          value: `<t:${Math.round(member.joinedAt / 1000)}:F> (<t:${Math.round(member.joinedAt / 1000)}:R>)`
        })
      }
      event.embeds[0].fields.push({
        name: 'Created At',
        value: `<t:${Math.round(member.createdAt / 1000)}:F> (<t:${Math.round(member.createdAt / 1000)}:R>)`
      }, {
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.id}\`\`\``
      })
      return send(event)
    }
  }
}

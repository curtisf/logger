const send = require('../modules/webhooksender')
const cacheGuild = require('../utils/cacheGuild')

module.exports = {
  name: 'guildMemberUpdate',
  type: 'on',
  handle: async (guild, member, oldMember) => {
    if (!guild.members.get(global.bot.user.id).permission.json['viewAuditLogs'] || !guild.members.get(global.bot.user.id).permission.json['manageWebhooks']) return
    const guildMemberUpdate = {
      guildID: guild.id,
      eventName: 'guildMemberUpdate',
      embed: {
        author: {
          name: `${member.username}#${member.discriminator}`,
          icon_url: member.avatarURL
        },
        description: `${member.username}#${member.discriminator} ${member.mention} ${member.nick ? `(${member.nick})` : ''} was updated`,
        fields: [{
          name: 'Changes',
          value: 'Unknown. Look at the footer to see who updated the affected user.'
        }]
      }
    }
    if (member.roles.length !== oldMember.roles.length || member.roles.filter(r => !oldMember.roles.includes(r)).length !== 0) {
      guild.getAuditLogs(1, null, 25).then(async (log) => {
        if (!log.entries[0]) return
        let auditEntryDate = new Date((log.entries[0].id / 4194304) + 1420070400000)
        if (new Date().getTime() - auditEntryDate.getTime() < 3000) {
          log.entries[0].guild = []
          let user = log.entries[0].user
          if (!global.bot.guildSettingsCache[guild.id]) {
            await cacheGuild(guild.id)
          }
          if (user.bot && global.bot.guildSettingsCache[guild.id].isLogBots()) {
            await processRoleChange()
          } else if (!user.bot) {
            await processRoleChange()
          }
          async function processRoleChange () {
            let added = []
            let removed = []
            let roleColor
            if (log.entries[0].after.$add) {
              if (log.entries[0].after.$add.length !== 0) log.entries[0].after.$add.forEach(r => added.push(r))
            }
            if (log.entries[0].after.$remove) {
              if (log.entries[0].after.$remove.length !== 0) log.entries[0].after.$remove.forEach(r => removed.push(r))
            }
            if (added.length !== 0) {
              roleColor = guild.roles.find(r => r.id === added[0].id).color
            } else if (removed.length !== 0) {
              roleColor = guild.roles.find(r => r.id === removed[0].id).color
            }
            // Add a + or - emoji when roles are manipulated for a user, stringify it, and assign a field value to it.
            guildMemberUpdate.embed.fields[0].value = `${added.map(role => `➕ **${role.name}**`).join('\n')}${removed.map((role, i) => `${i === 0 && added.length !== 0 ? '\n' : ''}\n:x: **${role.name}**`).join('\n')}`
            guildMemberUpdate.embed.color = roleColor
            guildMemberUpdate.embed.footer = {
              text: `${user.username}#${user.discriminator}`,
              icon_url: `${user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`}`
            }
            guildMemberUpdate.embed.fields.push({
              name: 'ID',
              value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${user.id}\`\`\``
            })
            await send(guildMemberUpdate)
          }
        }
      }).catch(() => {return})
    } else if (member.nick !== oldMember.nick) {
      guildMemberUpdate.eventName = 'guildMemberNickUpdate'
      guildMemberUpdate.embed.fields[0] = ({
        name: 'New name',
        value: `${member.nick ? member.nick : member.username}#${member.discriminator}`
      })
      guildMemberUpdate.embed.fields.push({
        name: 'Old name',
        value: `${oldMember.nick ? oldMember.nick : member.username}#${member.discriminator}`
      })
      guildMemberUpdate.embed.fields.push({
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.id}\`\`\``
      })
      await send(guildMemberUpdate)
    }
  }
}

function arrayCompare (base, toCompare) {
  let baseArr = base.filter(i => { return toCompare.indexOf(i) < 0 })
  let comparedArr = toCompare.filter(i => { return base.indexOf(i) < 0 })
  return baseArr.concat(comparedArr)
}

const send = require('../modules/webhooksender')
const cacheGuild = require('../utils/cacheGuild')
const arrayCompare = require('../utils/arraycompare')

module.exports = {
  name: 'guildMemberUpdate',
  type: 'on',
  handle: async (guild, member, oldMember) => {
    if (!guild.members.get(global.bot.user.id).permissions.json.viewAuditLogs || !guild.members.get(global.bot.user.id).permissions.json.manageWebhooks) return
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
    if (oldMember && member.nick !== oldMember.nick) { // if member is cached and nick is different
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
    // if member cached and roles not different, stop here.
    if (oldMember && arrayCompare(member.roles, oldMember.roles)) return // if roles are the same stop fetching audit logs
    guild.getAuditLogs(5, null, 25).then(async log => {
      if (!log.entries[0]) return
      const possibleLogs = log.entries.filter(e => e.targetID === member.id)
      if (possibleLogs.length !== 0) log = possibleLogs[0]
      else return // no log, what's the point
      if (log && Date.now() - ((log.id / 4194304) + 1420070400000) < 3000) { // we are guaranteed to get unique logs for member update actions now
        // This time check exists solely when the member is not cached and updates their nickname. It's considered a member update and not nick update
        log.guild = []
        const user = log.user
        if (!global.bot.guildSettingsCache[guild.id]) {
          await cacheGuild(guild.id)
        }
        if (user.bot && !global.bot.guildSettingsCache[guild.id].isLogBots()) return
        const added = []
        const removed = []
        let roleColor
        if (log.after.$add) {
          if (log.after.$add.length !== 0) log.after.$add.forEach(r => added.push(r))
        }
        if (log.after.$remove) {
          if (log.after.$remove.length !== 0) log.after.$remove.forEach(r => removed.push(r))
        }
        if (added.length !== 0) {
          roleColor = guild.roles.find(r => r.id === added[0].id).color
        }
        if (removed.length !== 0) {
          roleColor = guild.roles.find(r => r.id === removed[0].id).color
        }
        // Add a + or - emoji when roles are manipulated for a user, stringify it, and assign a field value to it.
        guildMemberUpdate.embed.fields[0].value = `${added.map(role => `➕ **${role.name}**`).join('\n')}${removed.map((role, i) => `${i === 0 && added.length !== 0 ? '\n' : ''}\n:x: **${role.name}**`).join('\n')}`
        guildMemberUpdate.embed.color = roleColor
        guildMemberUpdate.embed.footer = {
          text: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        }
        guildMemberUpdate.embed.fields.push({
          name: 'ID',
          value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${user.id}\`\`\``
        })
        await send(guildMemberUpdate)
      }
    }).catch(() => {})
  }
}

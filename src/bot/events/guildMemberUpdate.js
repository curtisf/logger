const send = require('../modules/webhooksender')
const cacheGuild = require('../utils/cacheGuild')
const arrayCompare = require('../utils/arraycompare')

const canUseExternal = guild => {
  const logChannelID = global.bot.guildSettingsCache[guild.id].event_logs.guildMemberUpdate
  if (logChannelID) {
    const logChannel = global.bot.getChannel(logChannelID)
    const permOverwrite = !!logChannel.permissionOverwrites.get(guild.id)?.json.useExternalEmojis
    if (permOverwrite) return true
  }
  return !!guild.roles.get(guild.id)?.permissions.json.useExternalEmojis
}

module.exports = {
  name: 'guildMemberUpdate',
  type: 'on',
  handle: async (guild, member, oldMember) => {
    const guildMemberUpdate = {
      guildID: guild.id,
      eventName: 'guildMemberUpdate',
      embeds: [{
        author: {
          name: `${member.username}#${member.discriminator}`,
          icon_url: member.avatarURL
        },
        description: `${member.username}#${member.discriminator} ${member.mention} ${member.nick ? `(${member.nick})` : ''} was updated`,
        fields: [{
          name: 'Changes',
          value: 'Unknown. Look at the footer to see who updated the affected user.'
        }]
      }]
    }
    if (oldMember && member.nick !== oldMember.nick) { // if member is cached and nick is different
      if (member.bot && !global.bot.guildSettingsCache[guild.id].isLogBots()) return
      guildMemberUpdate.eventName = 'guildMemberNickUpdate'
      guildMemberUpdate.embeds[0].description = `${member.mention} ${member.nick ? `(now ${member.nick})` : ''} was updated`
      delete guildMemberUpdate.author
      guildMemberUpdate.embeds[0].fields[0] = ({
        name: 'New Name',
        value: `${member.nick ? member.nick : member.username}#${member.discriminator}`
      })
      guildMemberUpdate.embeds[0].fields.push({
        name: 'Old Name',
        value: `${oldMember.nick ? oldMember.nick : member.username}#${member.discriminator}`
      })
      guildMemberUpdate.embeds[0].fields.push({
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.id}\`\`\``
      })
      await send(guildMemberUpdate)
    } else if (oldMember?.pending && !member.pending && guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) {
      guildMemberUpdate.eventName = 'guildMemberVerify'
      guildMemberUpdate.embeds[0].description = `${member.mention} (${member.username}#${member.discriminator}: \`${member.id}\`) has verified.`
      guildMemberUpdate.embeds[0].author = {
        name: `${member.username}#${member.discriminator}`,
        icon_url: member.avatarURL
      }
      guildMemberUpdate.embeds[0].color = 0x1ced9a
      delete guildMemberUpdate.embeds[0].fields
      await send(guildMemberUpdate)
    } else if (oldMember && oldMember.premiumSince !== member.premiumSince) {
      const embedCopy = guildMemberUpdate
      embedCopy.eventName = 'guildMemberBoostUpdate'
      embedCopy.embeds[0].description = `${member.mention} has ${member.premiumSince ? 'boosted' : 'stopped boosting'} the server.`
      embedCopy.embeds[0].author = {
        name: `${member.username}#${member.discriminator}`,
        icon_url: member.avatarURL
      }
      embedCopy.embeds[0].color = member.premiumSince ? 0x15cc12 : 0xeb4034
      delete embedCopy.embeds[0].fields
      await send(embedCopy)
    }
    // if member cached and roles not different, stop here.
    if (oldMember && arrayCompare(member.roles, oldMember.roles)) return // if roles are the same stop fetching audit logs
    guild.getAuditLog({ limit: 5, actionType: 25 }).then(async log => {
      if (!log.entries[0]) return
      const possibleLog = log.entries.find(e => e.targetID === member.id && Date.now() - ((e.id / 4194304) + 1420070400000) < 3000)
      if (possibleLog) log = possibleLog
      else return // no log, what's the point
      if (log) { // we are guaranteed to get unique logs for member update actions now
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
        guildMemberUpdate.embeds[0].fields = [{
          name: 'Changes',
          value: `${added.map(role => `${canUseExternal(guild) ? '<:greenplus:562826499929931776>' : '➕'} **${role.name}**`).join('\n')}${removed.map((role, i) => `${i === 0 && added.length !== 0 ? '\n' : ''}\n:x: **${role.name}**`).join('\n')}`
        }]
        guildMemberUpdate.embeds[0].color = roleColor
        guildMemberUpdate.embeds[0].footer = {
          text: `${user.username}#${user.discriminator}`,
          icon_url: user.avatarURL
        }
        guildMemberUpdate.embeds[0].fields.push({
          name: 'ID',
          value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${user.id}\`\`\``
        })
        if (!guildMemberUpdate.embeds[0].fields[0].value) return
        await send(guildMemberUpdate)
      }
    }).catch(() => {})
  }
}

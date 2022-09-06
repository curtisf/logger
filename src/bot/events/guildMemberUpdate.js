const send = require('../modules/webhooksender')
const cacheGuild = require('../utils/cacheGuild')
const arrayCompare = require('../utils/arraycompare')
const markdownEscape = require('markdown-escape')

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
    if (!global.bot.guilds.get(guild.id)) { // don't try to log something when the bot isn't in the guild
      return
    }
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
    if (!global.bot.guildSettingsCache[guild.id]) {
      await cacheGuild(guild.id)
    }
    if (oldMember && member.nick !== oldMember.nick) { // if member is cached and nick is different
      if (member.bot && !global.bot.guildSettingsCache[guild.id].isLogBots()) return
      guildMemberUpdate.eventName = 'guildMemberNickUpdate'
      guildMemberUpdate.embeds[0].description = `${member.mention} ${member.nick ? `(now ${member.nick})` : ''} was updated`
      delete guildMemberUpdate.author
      guildMemberUpdate.embeds[0].fields[0] = {
        name: 'New Name',
        value: `${member.nick ? member.nick : member.username}#${member.discriminator}`
      }
      guildMemberUpdate.embeds[0].fields.push({
        name: 'Old Name',
        value: `${oldMember.nick ? oldMember.nick : member.username}#${member.discriminator}`
      })
      guildMemberUpdate.embeds[0].fields.push({
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.id}\`\`\``
      })
      if (!guildMemberUpdate.embeds[0].fields[0].value) return
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
    } else if (oldMember && oldMember.roles && oldMember.premiumSince != member.premiumSince) {
      const boostRole = guild.roles.find(r => r?.tags?.premium_subscriber === true)
      if (!boostRole) return
      const embedCopy = guildMemberUpdate
      const oldMemberHasBoostRole = oldMember.roles.includes(boostRole.id)
      const newMemberHasBoostRole = member.roles.includes(boostRole.id)
      if (oldMemberHasBoostRole === newMemberHasBoostRole) return // something bugged and this was called when there wasn't really a boost update... although this doesn't log subsequent boosts by a current booster.
      embedCopy.eventName = 'guildMemberBoostUpdate'
      embedCopy.embeds[0].description = `${member.mention} has ${newMemberHasBoostRole ? 'boosted' : 'stopped boosting'} the server.`
      embedCopy.embeds[0].author = {
        name: `${member.username}#${member.discriminator}`,
        icon_url: member.avatarURL
      }
      embedCopy.embeds[0].color = member.premiumSince ? 0x15cc12 : 0xeb4034
      delete embedCopy.embeds[0].fields
      await send(embedCopy)
    }
    // if member cached and roles not different, stop here.
    if ((oldMember && arrayCompare(member.roles, oldMember.roles) && (member.communicationDisabledUntil === oldMember.communicationDisabledUntil))) return // if roles are the same stop fetching audit logs
    const logs = await guild.getAuditLog({ limit: 5 })
    if (!logs.entries[0]) return
    const possibleRoleLog = logs.entries.find(e => e.targetID === member.id && e.actionType === 25 && Date.now() - ((e.id / 4194304) + 1420070400000) < 3000)
    const possibleTimeoutLog = logs.entries.find(e => e.targetID === member.id && e.actionType === 24 && (e.before.communication_disabled_until || e.after.communication_disabled_until) && Date.now() - ((e.id / 4194304) + 1420070400000) < 3000)
    if (possibleRoleLog) {
      possibleRoleLog.guild = []
      const user = possibleRoleLog.user
      if (user.bot && !global.bot.guildSettingsCache[guild.id].isLogBots()) return
      const added = []
      const removed = []
      let roleColor
      if (possibleRoleLog.after.$add) {
        if (possibleRoleLog.after.$add.length !== 0) possibleRoleLog.after.$add.forEach(r => added.push(r))
      }
      if (possibleRoleLog.after.$remove) {
        if (possibleRoleLog.after.$remove.length !== 0) possibleRoleLog.after.$remove.forEach(r => removed.push(r))
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
      if (guildMemberUpdate.embeds[0].fields[0].value.length > 1000) {
        guildMemberUpdate.embeds[0].fields[0].value = guildMemberUpdate.embeds[0].fields[0].value.substring(0, 1020) + '...'
      }
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
    } else if (possibleTimeoutLog) {
      guildMemberUpdate.embeds[0].description = `${member.username}#${member.discriminator} (${member.mention}) ${member.communicationDisabledUntil ? 'was timed out' : 'had their timeout removed'}`
      guildMemberUpdate.embeds[0].author = {
        name: `${member.username}#${member.discriminator}`,
        icon_url: member.avatarURL
      }
      guildMemberUpdate.embeds[0].footer = {
        text: `${possibleTimeoutLog.user.username}#${possibleTimeoutLog.user.discriminator}`,
        icon_url: possibleTimeoutLog.user.avatarURL
      }
      guildMemberUpdate.embeds[0].fields = []
      guildMemberUpdate.embeds[0].fields.push({
        name: 'Timeout Creator',
        value: `${possibleTimeoutLog.user.username}#${possibleTimeoutLog.user.discriminator}`
      })
      if (possibleTimeoutLog.reason) {
        guildMemberUpdate.embeds[0].fields.push({
          name: 'Reason',
          value: markdownEscape(possibleTimeoutLog.reason)
        })
      }
      if (member.communicationDisabledUntil) {
        guildMemberUpdate.embeds[0].fields.push({
          name: 'Expiration',
          value: `<t:${Math.ceil(member.communicationDisabledUntil / 1000)}> (<t:${Math.ceil(member.communicationDisabledUntil / 1000)}:R>)`
        })
      } else {
        guildMemberUpdate.embeds[0].fields.push({
          name: 'Expiration',
          value: `Was until <t:${Math.ceil(Date.parse(possibleTimeoutLog.before.communication_disabled_until) / 1000)}> (<t:${Math.ceil(Date.parse(possibleTimeoutLog.before.communication_disabled_until) / 1000)}:R>)`
        })
      }
      guildMemberUpdate.embeds[0].fields.push({
        name: 'ID',
        value: `\`\`\`ini\nUser = ${member.id}\nPerpetrator = ${possibleTimeoutLog.user.id}\`\`\``
      })
      await send(guildMemberUpdate)
    }
  }
}

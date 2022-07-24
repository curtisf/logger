const escape = require('markdown-escape')
const send = require('../modules/webhooksender')

const checkExempt = [
  'afk_channel_id',
  'default_message_notifications',
  'system_channel_id',
  'afk_timeout'
]

const verificationLevels = {
  0: 'Unrestricted',
  1: 'Low - must have a verified email',
  2: 'Medium - must be registered for 5 minutes',
  3: 'High - 10 minutes of membership required',
  4: 'Highest - verified phone required'
}

const explicitContentLevels = {
  0: 'No Scanning Enabled',
  1: 'Scanning content from members without a role',
  2: 'Scanning content from all members'
}

module.exports = {
  name: 'guildUpdate',
  type: 'on',
  handle: async (newGuild, oldGuild) => {
    const fields = []
    newGuild.getAuditLogs({ actionType: 1, limit: 1 }).then((log) => {
      if (!log || !log.entries || log.entries.length === 0 || new Date().getTime() - new Date((log.entries[0].id / 4194304) + 1420070400000).getTime() > 3000) return // this could be null coalesced but why not make it backwards compatible
      const user = log.entries[0].user
      const member = newGuild.members.get(user.id)
      let arr
      // This is the only instance where referring to an audit log by position returned is okay.
      // Results are returned sorted by id (newer id is a larger number & comes up first)
      if (Object.keys(log.entries[0].before) > Object.keys(log.entries[0].after)) {
        arr = Object.keys(log.entries[0].before)
      } else {
        arr = Object.keys(log.entries[0].after)
      }
      arr.forEach((key) => {
        if (log.entries[0].before[key] !== log.entries[0].after[key] || checkExempt.includes(key)) { // if both guilds have the property and they don't equal eachother
          const data = handle(key, log.entries[0])
          if (data) fields.push(data)
        }
      })
      if (fields.length === 0) return
      send({
        guildID: newGuild.id,
        eventName: 'guildUpdate',
        embeds: [{
          author: {
            name: `${user.username}#${user.discriminator} ${member && member.nick ? `(${member.nick})` : ''}`,
            icon_url: user.avatarURL
          },
          description: 'The guild was updated',
          fields: fields,
          color: 3553599
        }]
      })
    }).catch(() => {})
    // TODO: handle new guild updates, son! (update: will jump on this next, see project board on github)
    function handle (name, logEntry) {
      let after = 'None'
      let before = 'None'
      switch (name) {
        case 'system_channel_id':
          if (logEntry.before.system_channel_id) {
            before = logEntry.before.system_channel_id ? newGuild.channels.get(logEntry.before.system_channel_id).name : 'None'
          }
          if (logEntry.after.system_channel_id) {
            after = logEntry.after.system_channel_id ? newGuild.channels.get(logEntry.after.system_channel_id).name : 'None'
          }
          return {
            name: 'Welcome Message Channel',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'afk_timeout':
          if (logEntry.before.afk_timeout) {
            before = logEntry.before.afk_timeout / 60
          }
          if (logEntry.after.afk_timeout) {
            after = logEntry.after.afk_timeout / 60
          }
          return {
            name: 'AFK Timeout',
            value: `► Now: **${after}** minutes\n► Was: **${before}** minutes`
          }
        case 'default_message_notifications':
          if (logEntry.before.default_message_notifications !== undefined) {
            before = logEntry.before.default_message_notifications === 0 ? 'All Messages' : 'Mentions'
          }
          if (logEntry.after.default_message_notifications !== undefined) {
            after = logEntry.after.default_message_notifications === 0 ? 'All Messages' : 'Mentions'
          }
          return {
            name: 'Message Notifications',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'afk_channel_id':
          const beforeChannel = logEntry.before && newGuild.channels.get(logEntry.before.afk_channel_id)
          const afterChannel = logEntry.after && newGuild.channels.get(logEntry.after.afk_channel_id)
          if (!beforeChannel) {
            before = 'None'
          } else {
            before = beforeChannel.name
          }
          if (!afterChannel) {
            after = 'None'
          } else {
            after = afterChannel.name
          }
          return {
            name: 'AFK Channel',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'name':
          before = logEntry.before.name
          after = logEntry.after.name
          return {
            name: 'Name',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'region':
          before = logEntry.before.region
          after = logEntry.after.region
          return {
            name: 'Region',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'icon':
          before = 'Not Available'
          after = newGuild.icon ? `[This](\`https://cdn.discordapp.com/icons/${newGuild.id}/${newGuild.icon}.jpg\`)` : 'None'
          return {
            name: 'Icon',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'features':
          before = 'Not Available'
          after = 'Not Available'
          return {
            name: 'Features ⚠ WARNING: This isn\'t changed very often!',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'splash':
          before = 'Not Available'
          after = 'Not Available'
          return {
            name: 'Splash Image ⚠ WARNING: This isn\'t changed very often',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'verification_level':
          return {
            name: 'Verification Level',
            value: verificationLevels[logEntry.after.verification_level]
          }
        case 'mfa_level':
          before = logEntry.before.mfa_level === 1 ? 'Enabled' : 'Disabled'
          after = logEntry.after.mfa_level === 1 ? 'Enabled' : 'Disabled'
          return {
            name: 'MFA Level',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'explicit_content_filter':
          before = explicitContentLevels[logEntry.before.explicit_content_filter]
          after = explicitContentLevels[logEntry.after.explicit_content_filter]
          return {
            name: 'Explicit Content Filter',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'widget_enabled':
          before = logEntry.before.widget_enabled ? 'Enabled' : 'Disabled'
          after = logEntry.after.widget_enabled ? 'Enabled' : 'Disabled'
          return {
            name: 'Widget Enabled',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'rules_channel_id':
          before = logEntry.before.rules_channel_id ? global.bot.getChannel(logEntry.before.rules_channel_id).name || 'None' : 'None',
          after = logEntry.after.rules_channel_id ? global.bot.getChannel(logEntry.after.rules_channel_id).name || 'None' : 'None'
          return {
            name: 'Rules Channel Location',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'public_updates_channel_id':
          before = logEntry.before.public_updates_channel_id ? global.bot.getChannel(logEntry.before.public_updates_channel_id).name || 'None' : 'None',
          after = logEntry.after.public_updates_channel_id ? global.bot.getChannel(logEntry.after.public_updates_channel_id).name || 'None' : 'None'
          return {
            name: 'Public Updates Channel Location',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'preferred_locale':
          before = logEntry.before.preferred_locale
          after = logEntry.after.preferred_locale
          return {
            name: 'Server Locale',
            value: `► Now: **${after}**\n► Was: **${before}**`
          }
        case 'description':
          before = logEntry.before.description
          after = logEntry.after.description
          return {
            name: 'Server Description',
            value: `► Now: **${escape(after)}**\n► Was: **${escape(before)}**`
          }
      }
    }
  }
}

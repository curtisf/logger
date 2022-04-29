const { EMBED_COLORS } = require('../utils/constants')

const notablePermissions = [
  'kickMembers',
  'banMembers',
  'administrator',
  'manageChannels',
  'manageGuild',
  'manageMessages',
  'manageRoles',
  'manageEmojis',
  'manageWebhooks',
  'prioritySpeaker'
]

module.exports = {
  name: 'userinfo',
  func: async interaction => {
    const perms = []
    const guild = global.bot.guilds.get(interaction.guildID)
    if (!guild) {
      global.logger.warn('Missing guild in userinfo slash command')
      return
    }
    let member = interaction.member
    const userInteractionOpt = interaction.data.options?.find(o => o.name === 'user')
    if (userInteractionOpt) {
      if (!interaction.data.resolved.members.get(userInteractionOpt.value)) {
        global.logger.warn('Missing resolved member for userinfo in slash command')
        return
      }
      member = interaction.data.resolved.members.get(userInteractionOpt.value)
    }

    Object.keys(member.permissions.json).forEach((perm) => {
      if (member.permissions.json[perm] === true && notablePermissions.indexOf(perm) !== -1) {
        perms.push(`\`${perm}\``)
      }
    })
    const roles = member.roles.map(r => guild.roles.get(r)).sort((a, b) => b.position - a.position)
    const fields = [{
      name: 'Name',
      value: `${member.username}#${member.discriminator} ${member.nick ? `(**${member.nick}**)` : ''} (${member.id})`
    }, {
      name: 'Join Date',
      value: `<t:${Math.round(member.joinedAt / 1000)}:F> (<t:${Math.round(member.joinedAt / 1000)}:R>)`
    }, {
      name: 'Creation Date',
      value: `<t:${Math.round(((member.id / 4194304) + 1420070400000) / 1000)}:F>`
    }, {
      name: 'Roles',
      value: roles.length !== 0 ? roles.map(c => `\`${c.name}\``).join(', ') : 'None'
    }, {
      name: 'Notable Permissions',
      value: perms.length !== 0 ? perms.join(', ') : 'None'
    }]
    interaction.createMessage({
      embeds: [{
        color: roles.length !== 0 ? roles[0].color : EMBED_COLORS.PURPLED_BLUE,
        thumbnail: {
          url: member.user.dynamicAvatarURL(null, 64)
        },
        fields: fields
      }]
    }).catch(() => { })
  }
}

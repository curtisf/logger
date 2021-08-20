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
  func: async message => {
    let member = message.member
    if (message.mentions.length !== 0) member = message.channel.guild.members.get(message.mentions[0].id)
    const fields = []
    const perms = []
    Object.keys(member.permissions.json).forEach((perm) => {
      if (member.permissions.json[perm] === true && notablePermissions.indexOf(perm) !== -1) {
        perms.push(`\`${perm}\``)
      }
    })
    const roles = member.roles.map(r => message.channel.guild.roles.get(r)).sort((a, b) => b.position - a.position)
    fields.push({
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
    })
    message.channel.createMessage({
      embeds: [{
        timestamp: new Date(message.timestamp),
        color: roles.length !== 0 ? roles[0].color : 3553599,
        thumbnail: {
          url: member.avatar ? member.avatarURL : `https://cdn.discordapp.com/embed/avatars/${member.discriminator % 5}.png`
        },
        fields: fields
      }]
    }).catch(() => { })
  },
  name: 'userinfo',
  quickHelp: 'Use this with a mention to get info about a user or about yourself with no mention.', // The restriction of using a mention is very intentional.
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}userinfo\` <- create an embed showing information about you
  \`${process.env.GLOBAL_BOT_PREFIX}userinfo @AnyUser\` <- create an embed showing information about the user that was mentioned`,
  type: 'any',
  category: 'General'
}

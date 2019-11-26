const notablePermissions = [
  'kickMembers',
  'banMembers',
  'administrator',
  'manageChanneks',
  'manageGuilds',
  'manageMessages',
  'manageRoles',
  'manageEmojis',
  'manageWebhooks',
  'prioritySpeaker'
]

module.exports = {
  func: async message => {
    let member
    if (message.mentions.length !== 0) member = message.channel.guild.members.get(message.mentions[0].id)
    if (!member) member = message.member
    let fields = []
    let perms = []
    let color = 12552203 // away color
    if (member.status === 'online') {
      color = 8383059
    } else if (member.status === 'offline') {
      color = 12041157
    } else if (member.status === 'dnd') {
      color = 16396122
    }
    Object.keys(member.permission.json).forEach((perm) => {
      if (member.permission.json[perm] === true && notablePermissions.indexOf(perm) !== -1) {
        perms.push(perm)
      }
    })
    if (perms.length === 0) {
      perms.push('None')
    }
    fields.push({
      name: 'Name',
      value: `**${member.username}#${member.discriminator}** ${member.nick ? `(**${member.nick}**)` : ''} (${member.id})`
    }, {
      name: 'Join Date',
      value: `**${new Date(member.joinedAt)}** (${Math.round((new Date().getTime() - member.joinedAt) / (1000*60*60*24))} days)`
    }, {
      name: 'Creation Date',
      value: `**${new Date(member.createdAt).toString().substr(0, 21)}**`
    }, {
      name: 'Roles',
      value: `${member.roles.length !== 0 ? member.roles.map(r => `\`${message.channel.guild.roles.get(r).name}\``).join(', ') : 'None'}`
    }, {
      name: 'Notable Permissions',
      value: `\`${perms.join(', ')}\``
    })
    message.channel.createMessage({
      embed: {
        timestamp: new Date(message.timestamp),
        color: color,
        thumbnail: {
          url: member.avatar ? member.avatarURL : `https://cdn.discordapp.com/embed/avatars/${member.discriminator % 5}.png`
        },
        fields: fields
      }
    }).catch(() => { })
  },
  name: 'userinfo',
  description: 'Use this with a mention to get info about a user.', // The restriction of using a mention is very intentional.
  type: 'any',
  category: 'General'
}

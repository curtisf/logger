const send = require('../modules/webhooksender')

module.exports = {
  name: 'guildMemberAdd',
  type: 'on',
  handle: async (guild, member) => {
    let GMAEvent = {
      guildID: guild.id,
      eventName: 'guildMemberAdd',
      embed: {
        author: {
          name: `${member.username}#${member.discriminator}`,
          icon_url: member.avatarURL
        },
        description: `${member.mention} joined `,
        fields: [{
          name: 'Name',
          value: `${member.username}#${member.discriminator} (${member.id}) ${member.mention}`
        }, {
          name: 'Account Age',
          value: `**${Math.floor((new Date() - member.user.createdAt) / 86400000)}** days`
        },
        {
          name: 'Joined At',
          value: new Date().toString()
        },
        {
          name: 'Member Count',
          value: guild.memberCount
        },
        {
          name: 'ID',
          value: `\`\`\`ini\nMember = ${member.id}\nGuild = ${guild.id}\`\`\``
        }],
        color: 3553599
      }
    }
    await send(GMAEvent)
  }
}

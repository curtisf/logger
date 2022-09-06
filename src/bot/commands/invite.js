module.exports = {
  func: async message => {
    message.channel.createMessage({
      embeds: [{
        description: `Hi, you can invite me using my least-permission-required link [here](https://discord.com/oauth2/authorize?client_id=${global.bot.user.id}&scope=bot+applications.commands&permissions=537218176). If you want invite tracking, additional permissions are required. The invite for that can be accessed [here](https://discord.com/oauth2/authorize?client_id=${global.bot.user.id}&scope=bot+applications.commands&permissions=537218224). My configuration dashboard is [here](https://logger.bot). To see what invite is used for a member joining, you MUST grant **manage channels** and **manage server** for it to work (Discord does not send invite info to the bot otherwise)!`,
        color: 3553599,
        timestamp: new Date(),
        footer: {
          icon_url: global.bot.user.avatarURL,
          text: `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        author: {
          name: `${message.author.username}#${message.author.discriminator}`,
          icon_url: message.author.avatarURL
        }
      }]
    })
  },
  name: 'invite',
  quickHelp: 'Returns an embed with multiple invites to choose your preferred permissions.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}invite\` <- returns an embed with invites for different use cases (fewer required perms = better!)`,
  type: 'any',
  category: 'General'
}

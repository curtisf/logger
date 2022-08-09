const Eris = require('eris')
const { EMBED_COLORS } = require('../utils/constants.js')
const { getEmbedFooter } = require('../utils/embeds')

module.exports = {
  name: 'invite',
  func: async interaction => {
    interaction.createMessage({
      embeds: [{
        title: 'Invite Links',
        description: 'Below, invite links for different logging purposes are given. These invites exist individually to give you the ability to easily grant me the least permissions you need (principle of least privilege).\n\nSee `/help guide: Usage` after using an invite below to learn how to configure me!',
        color: EMBED_COLORS.PURPLED_BLUE,
        thumbnail: {
          url: interaction.member.user.dynamicAvatarURL(null, 64)
        },
        fields: [{
          name: 'General Invite (Least Permissions)',
          value: `Use [this invite link](https://discord.com/oauth2/authorize?client_id=${global.bot.user.id}&scope=bot+applications.commands&permissions=537218176) to invite me with the least permissions required.`
        }, {
          name: 'Invite Tracking Invite (requires manage server & manage channels to fetch data)',
          value: `Use [this invite link](https://discord.com/oauth2/authorize?client_id=${global.bot.user.id}&scope=bot+applications.commands&permissions=537218224) to invite me with the permissions required for invite tracking join logging. \`Manage Channels\` (can be channel permission overwrites) and \`Manage Server\` are **required** for invite logging on join because Discord does not send invite information to the bot without it. (Manage Channels: receives invites made for channels realtime | Manage Server: to fetch server invites)`
        }],
        footer: getEmbedFooter(global.bot.user)
      }],
      flags: Eris.Constants.MessageFlags.EPHEMERAL
    })
  }
}

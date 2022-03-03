const sa = require('superagent')
const { EMBED_COLORS } = require('../utils/constants.js')
const { getEmbedFooter } = require('../utils/embeds.js')

module.exports = {
  name: 'archive',
  perm: 'manageMessages',
  func: async interaction => {
    const canBotReadHistory = global.bot.getChannel(interaction.channel.id).permissionsOf(global.bot.user.id).json.readMessageHistory
    const canUserManageMessages = global.bot.getChannel(interaction.channel.id).permissionsOf(interaction.member.user.id).json.manageMessages
    const canUserSeeMessageHistory = global.bot.getChannel(interaction.channel.id).permissionsOf(interaction.member.user.id).json.readMessageHistory
    if (!canBotReadHistory) {
      interaction.createMessage('I lack the read chat history permission!').catch(() => {}) // original message deleted
    } else if (!canUserManageMessages || !canUserSeeMessageHistory) {
      interaction.createMessage(`You need both Manage Messages and Read Chat History permissions to use this command (missing ${!canUserManageMessages ? 'manage messages' : 'read message history'}).`).catch(() => {})
    } else {
      if (!interaction.data.options || !interaction.data.options[0] || interaction.data.options[0].value > 1000 || interaction.data.options[0].value < 5) {
        interaction.createMessage({
          embed: {
            title: 'Unsuccessful',
            description: 'Amount must be 5 <= amount < 1000',
            thumbnail: {
              url: interaction.member.user.dynamicAvatarURL(null, 64)
            },
            color: EMBED_COLORS.RED,
            footer: getEmbedFooter(global.bot.user)
          }
        }).catch(() => {})
      }
      const fetchedMessages = await global.bot.getChannel(interaction.channel.id).getMessages(interaction.data.options[0].value)
      const pasteString = fetchedMessages.reverse().map(m => `${m.author.username}#${m.author.discriminator} (${m.author.id}) | ${new Date(m.timestamp)}: ${m.content ? m.content : ''} | ${m.embeds.length === 0 ? '' : `{"embeds": [${m.embeds.map(e => JSON.stringify(e))}]}`} | ${m.attachments.length === 0 ? '' : ` =====> Attachment: ${m.attachments[0].filename}:${m.attachments[0].url}`}`).join('\r\n')
      try {
        await interaction.createMessage({
          embed: { // make sure followup message is created before doing any more work
            title: 'Processing',
            description: `Processing request from ${interaction.member.username}#${interaction.member.discriminator} for an archive of ${interaction.data.options[0].value} messages`,
            thumbnail: {
              url: interaction.member.user.dynamicAvatarURL(null, 64)
            },
            color: EMBED_COLORS.YELLOW_ORANGE,
            footer: getEmbedFooter(global.bot.user)
          }
        })
      } catch (_) {}
      sa
        .post(process.env.PASTE_CREATE_ENDPOINT)
        .set('Authorization', process.env.PASTE_CREATE_TOKEN)
        .set('Content-Type', 'text/plain')
        .send(pasteString || 'No messages were able to be archived')
        .end((err, res) => {
          if (!err && res.statusCode === 200 && res.body.key) {
            interaction.editOriginalMessage({
              embed: {
                title: 'Success',
                description: `Archived ${fetchedMessages.length} messages: https://haste.logger.bot/${res.body.key}.txt`,
                thumbnail: {
                  url: interaction.member.user.dynamicAvatarURL(null, 64)
                },
                color: EMBED_COLORS.GREEN,
                footer: getEmbedFooter(global.bot.user)
              }
            }).catch(() => {})
          } else {
            interaction.editOriginalMessage({
              embed: {
                title: 'Error',
                description: 'The archive service returned an error, please try again later!',
                thumbnail: {
                  url: interaction.member.user.dynamicAvatarURL(null, 64)
                },
                color: EMBED_COLORS.RED,
                footer: getEmbedFooter(global.bot.user)
              }
            }).catch(() => {})
            global.logger.error(err, res.body)
            global.webhook.error('An error has occurred while posting to the paste website. Check logs for more.')
          }
        })
    }
  }
}

const sa = require('superagent')
const { EMBED_COLORS } = require('../utils/constants.js')
const { getEmbedFooter, getAuthorField } = require('../utils/embeds.js')

module.exports = {
  name: 'archive',
  botPerms: ['readMessageHistory'],
  userPerms: ['readMessageHistory', 'manageMessages'],
  func: async interaction => {
    if (!interaction.data.options || !interaction.data.options[0] || interaction.data.options[0].value > 1000 || interaction.data.options[0].value < 5) {
      interaction.createMessage({
        embeds: [{
          title: 'Unsuccessful',
          description: 'Amount must be 5 <= amount < 1000',
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          color: EMBED_COLORS.RED,
          footer: getEmbedFooter(global.bot.user),
          author: getAuthorField(interaction.member.user)
        }]
      }).catch(() => {})
    }
    const fetchedMessages = await global.bot.getChannel(interaction.channel.id).getMessages({ limit: interaction.data.options[0].value })
    const pasteString = fetchedMessages.reverse().filter(m => !m.applicationID).map(m => `${m.author.username}#${m.author.discriminator} (${m.author.id}) | ${new Date(m.timestamp)}: ${m.content ? m.content : ''} | ${m.embeds.length === 0 ? '' : `{"embeds": [${m.embeds.map(e => JSON.stringify(e))}]}`} | ${m.attachments.length === 0 ? '' : ` =====> Attachment: ${m.attachments[0].filename}:${m.attachments[0].url}`}`).join('\r\n')
    try {
      await interaction.createMessage({
        embeds: [{ // make sure followup message is created before doing any more work
          title: 'Processing',
          description: `Processing request from ${interaction.member.username}#${interaction.member.discriminator} for an archive of ${interaction.data.options[0].value} messages`,
          thumbnail: {
            url: interaction.member.user.dynamicAvatarURL(null, 64)
          },
          color: EMBED_COLORS.YELLOW_ORANGE,
          footer: getEmbedFooter(global.bot.user),
          author: getAuthorField(interaction.member.user)
        }]
      })
    } catch (_) {}
    const uploadBuffer = Buffer.alloc(pasteString.length)
    uploadBuffer.write(pasteString)
    interaction.editOriginalMessage({
      embeds: [{
        title: 'Success',
        description: `Archived ${fetchedMessages.length} messages`,
        thumbnail: {
          url: interaction.member.user.dynamicAvatarURL(null, 64)
        },
        color: EMBED_COLORS.GREEN,
        footer: getEmbedFooter(global.bot.user),
        author: getAuthorField(interaction.member.user)
      }],
      file: {
        name: 'upload.txt',
        file: uploadBuffer
      }
    }).catch(() => {})
  }
}

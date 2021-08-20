const ignoreChannel = require('../../db/interfaces/postgres/update').ignoreChannel

module.exports = {
  func: async (message, suffix) => {
    let toIgnore = message.channel.id
    if (suffix && !isNaN(parseInt(suffix))) {
      const channelToIgnore = message.channel.guild.channels.get(suffix)
      if (!channelToIgnore || !(channelToIgnore.type === 2 || channelToIgnore.type === 0)) return message.channel.createMessage(`Usage: ${process.env.GLOBAL_BOT_PREFIX}ignorechannel OR ${process.env.GLOBAL_BOT_PREFIX}ignorechannel channelID`)
      toIgnore = suffix
    }
    const disabled = await ignoreChannel(message.channel.guild.id, toIgnore) // return a boolean representing whether a channel is ignored or not
    const respStr = `Toggled logging events targeting <#${toIgnore}> (${message.channel.guild.channels.get(toIgnore).name}). I am now ${disabled ? 'ignoring' : 'logging'} events from this channel`
    message.channel.createMessage({
      embeds: [{
        description: respStr,
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
  name: 'ignorechannel',
  quickHelp: 'Ignore any event that originates from the channel this command is used in. Use in the text channel you want to the bot to ignore OR provide a channel id (can be a voice channel) as a suffix.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}ignorechannel\` <- ignore events from the channel this is ran in
  \`${process.env.GLOBAL_BOT_PREFIX}ignorechannel voice channel id\` <- ignore voice events related to the given channel
  \`${process.env.GLOBAL_BOT_PREFIX}ignorechannel text channel id\` <- ignore text-related events related to the given channel`,
  type: 'custom',
  perm: 'manageChannels',
  category: 'Logging'
}

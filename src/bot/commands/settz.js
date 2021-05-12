const { MOST_TIMEZONES } = require('../utils/constants')
const { setTimezone } = require('../../db/interfaces/postgres/update')

module.exports = {
  func: async (message, suffix) => {
    if (!message.member.permissions.json.manageGuild) {
      await message.channel.createMessage({
        embed: {
          description: 'You must have Manage Server permission to use settz.',
          author: {
            name: `${message.author.username}#${message.author.discriminator}`,
            icon_url: message.author.avatarURL
          },
          color: 16711680 // red
        }
      })
    } else if (!suffix || (!MOST_TIMEZONES.includes(suffix) && suffix !== 'reset')) {
      await message.channel.createMessage({
        embed: {
          description: 'The provided timezone is not valid. You can use any timezone [here](https://gist.github.com/curtisf/6f9e68e6767fc8526a294761c0ca40cd) or `reset` to clear the saved timezone.',
          author: {
            name: `${message.author.username}#${message.author.discriminator}`,
            icon_url: message.author.avatarURL
          },
          color: 16711680 // red
        }
      })
    } else {
      await setTimezone(message.channel.guild.id, suffix !== 'reset' ? suffix : '')
      await message.channel.createMessage({
        embed: {
          description: `Done, future log timestamps will be using timezone ${suffix !== 'reset' ? suffix : 'GMT (default setting)'}`,
          author: {
            name: `${message.author.username}#${message.author.discriminator}`,
            icon_url: message.author.avatarURL
          },
          color: 65280 // green
        }
      })
    }
  },
  name: 'settz',
  quickHelp: 'Set the timezone the bot uses in your logs. Usable timezones are [here](https://gist.github.com/curtisf/6f9e68e6767fc8526a294761c0ca40cd). Custom timezones affect the userinfo command as well as channelDelete, channelUpdate, guildMemberAdd, guildMemberRemove, and messageDelete events.',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}settz reset\` <- reset custom timezone configuration back to UTC time (GMT)
  \`${process.env.GLOBAL_BOT_PREFIX}settz America/New_York\` <- use the New York timezone for logs
  \`${process.env.GLOBAL_BOT_PREFIX}settz Europe/Vienna\` <- use the Vienna timezone for logs
  \`${process.env.GLOBAL_BOT_PREFIX}settz Europe/Moscow\` <- use the Moscow timezone for logs`,
  type: 'any',
  perm: 'manageGuild',
  category: 'Utility'
}

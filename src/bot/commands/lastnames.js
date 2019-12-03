const getUser = require('../../db/interfaces/postgres/read').getUser

module.exports = {
  func: async (message, suffix) => {
    const memberPerms = message.member.permission.json
    if (memberPerms['kickMembers']) {
      let userID
      if (message.mentions.length !== 0) {
        userID = message.mentions[0].id
      }
      const splitSuffix = suffix.split(' ').filter(id => !isNaN(id))
      if (splitSuffix.length !== 0) {
        userID = splitSuffix[0]
      }
      if (!userID) userID = message.author.id
      if (!global.bot.users.get(userID) || !message.channel.guild.members.get(userID)) {
        await message.channel.createMessage({ embed: {
          'title': `${userID} isn't a valid user id (or isn't in this server)`,
          'description': `Provide a user id as a mention or just the id after this command`,
          'url': 'https://logger.bot/lastnames',
          'color': 3553599,
          'timestamp': new Date(),
          'footer': {
            'icon_url': global.bot.user.avatarURL,
            'text': `${global.bot.user.username}#${global.bot.user.discriminator}`
          },
          'thumbnail': {
            'url': message.author.avatarURL
          },
          'author': {
            'name': `${message.author.username}#${message.author.discriminator}`,
            'icon_url': message.author.avatarURL
          }
        } })
      } else {
        const userDoc = await getUser(userID)
        const user = message.channel.guild.members.get(userID)
        const m = await message.channel.createMessage({ embed: {
          'description': `${userDoc.names.length} stored names. <@${userDoc.id}>, type **${process.env.GLOBAL_BOT_PREFIX}clearmydata** to delete them.`,
          'url': 'https://logger.bot/lastnames',
          'color': 3553599,
          'timestamp': new Date(),
          'footer': {
            'icon_url': global.bot.user.avatarURL,
            'text': `${global.bot.user.username}#${global.bot.user.discriminator}`
          },
          'thumbnail': {
            'url': user.avatarURL
          },
          'author': {
            'name': `${user.username}#${user.discriminator}`,
            'icon_url': user.avatarURL
          },
          'fields': [{
            'name': 'Stored',
            'value': `\`\`\`${userDoc.names.length === 0 ? 'None' : userDoc.names.join(', ').substr(0, 1200)}\`\`\``
          }]
        } })
        await setTimeout(() => {
          m.delete()
        }, 20000) // don't let last names of a user linger
      }
    } else {
      const userDoc = await getUser(message.author.id)
      const m = await message.channel.createMessage({ embed: {
        'description': `${userDoc.names.length} stored names for you. Type **${process.env.GLOBAL_BOT_PREFIX}clearmydata** to delete them (you cannot kick members so you can only get your own names).`,
        'url': 'https://logger.bot/lastnames',
        'color': 3553599,
        'timestamp': new Date(),
        'footer': {
          'icon_url': global.bot.user.avatarURL,
          'text': `${global.bot.user.username}#${global.bot.user.discriminator}`
        },
        'thumbnail': {
          'url': message.author.avatarURL
        },
        'author': {
          'name': `${message.author.username}#${message.author.discriminator}`,
          'icon_url': message.author.avatarURL
        },
        'fields': [{
          'name': 'Stored',
          'value': `\`\`\`${userDoc.names.length === 0 ? 'None' : userDoc.names.join(', ').substr(0, 1200)}\`\`\``
        }]
      } })
      await setTimeout(() => {
        m.delete()
      }, 20000)
    }
  },
  name: 'lastnames',
  description: 'Get the last names of a user. This can only be used on a user who is a member of the guild. You need the *kick members* permission to view names of users other than yourself.',
  type: 'any',
  category: 'Utility'
}

module.exports = {
  func: async message => {
    let DMC
    try {
      DMC = await message.author.getDMChannel()
    } catch (e) {
      return message.channel.createMessage(`<@${message.author.id}>, you're not capable of receiving a DM from me.`).catch(() => {})
    }
    const embed = {
      description: 'Below, you can see my commands listed by name and description. If it has arguments you can pass, an example will be included.',
      color: 3553599,
      timestamp: new Date(),
      footer: {
        icon_url: global.bot.user.avatarURL,
        text: `${global.bot.user.username}#${global.bot.user.discriminator}`
      },
      thumbnail: {
        url: global.bot.user.avatarURL
      },
      author: {
        name: `${message.author.username}#${message.author.discriminator}`,
        icon_url: message.author.avatarURL
      },
      fields: []
    }
    Object.values(global.bot.commands).forEach(command => {
      if (!command.hidden) {
        embed.fields.push({
          name: command.name,
          value: command.description
        })
      }
    })
    embed.fields.push({
      name: 'Open Source',
      value: 'I am OSS at https://github.com/curtisf/loggerv3'
    },
    {
      name: 'Support',
      value: 'If something is going horribly wrong, go ahead and join [my support server](https://discord.gg/ed7Gaa3)'
    },
    {
      name: 'Dashboard',
      value: 'You can customize the bot to your liking at [the dashboard](https://logger.bot) (https://logger.bot).'
    },
    {
      name: 'Privacy Policy',
      value: 'You can view the privacy policy [here](https://gist.github.com/curtisf/0598b0930c11363d24e29300cf21d572). Similarly, if you want updates on when it changes, join my support server and follow the #privacy-policy channel.'
    },
    {
      name: 'Patreon',
      value: 'If you like me and want to support my owner (or want cool patron bot features), check out [my Patreon page](https://patreon.com/logger)\nSome of what Patrons get: image logging, see who deletes messages, ignore users, see archive and bulk delete logs in a prettified manner, archive up to 10,000 messages, messages are saved longer'
    })
    try {
      await DMC.createMessage({
        embed: embed
      })
      await message.addReaction('📜')
    } catch (_) {
      message.addReaction('❌')
    }
  },
  name: 'help',
  description: 'DM you with this help message!',
  type: 'any',
  category: 'General'
}

module.exports = {
  func: async message => {
    let DMC
    try {
      DMC = await message.author.getDMChannel()
    } catch (e) {
      message.channel.createMessage(`<@${message.author.id}>, you're not capable of receiving a DM from me.`)
    }
    const embed = {
      'description': 'Below, you can see my commands listed by name and description. If it has arguments you can pass, an example will be included.',
      'color': 3553599,
      'timestamp': new Date(),
      'footer': {
        'icon_url': global.bot.user.avatarURL,
        'text': `${global.bot.user.username}#${global.bot.user.discriminator}`
      },
      'thumbnail': {
        'url': global.bot.user.avatarURL
      },
      'author': {
        'name': `${message.author.username}#${message.author.discriminator}`,
        'icon_url': message.author.avatarURL
      },
      'fields': []
    }
    Object.values(global.bot.commands).forEach(command => {
      embed.fields.push({
        name: command.name,
        value: command.description
      })
    })
    embed.fields.push({
      name: 'Changes',
      value: 'Version 3 is in active testing at the moment. What changed? The bot was rewritten from scratch with a push for future viability and a dynamic framework. View my commands above for anything new. Look at what patreons get below. Why is nothing working?? The bot now needs manage webhook permissions as to abate the huge ratelimits from sending messages.'
    },{
      name: 'Support',
      value: 'If something is going horribly wrong, go ahead and join [my support server](https://discord.gg/ed7Gaa3)'
    },
    {
      name: 'Patreon',
      value: 'If you like me and want to support my owner (or want coolio Patreon features), check out [my Patreon page](https://patreon.com/logger)'
    })
    DMC.createMessage({
      embed: embed
    })
  },
  name: 'help',
  description: 'DM you with this help message!',
  type: 'any',
  category: 'General'
}

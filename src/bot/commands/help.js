module.exports = {
  func: async message => {
    let DMC
    try {
      DMC = await message.author.getDMChannel()
    } catch (e) {
      message.channel.createMessage(`<@${message.author.id}>, you're not capable of receiving a DM from me.`)
    }
    let embed = {
      'description': 'Below, you can see my commands listed by name and description. If it has arguments you can pass, an example will be included.',
      'color': 3553599,
      'timestamp': new Date(),
      'footer': {
        'icon_url': global.bot.user.avatarURL,
        'text': global.bot.user.username + '#' + global.bot.user.discriminator
      },
      'thumbnail': {
        'url': global.bot.user.avatarURL
      },
      'author': {
        'name': message.author.username + '#' + message.author.discriminator,
        'icon_url': message.author.avatarURL
      },
      'fields': []
    }
    Object.keys(bot.commands).map(k => bot.commands[k]).forEach((command) => {
      embed.fields.push({
        name: command.name,
        value: `${command.description}`
      })
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

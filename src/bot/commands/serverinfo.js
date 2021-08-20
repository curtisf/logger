const escape = require('markdown-escape')

module.exports = {
  func: async message => {
    const fields = []
    const owner = global.bot.users.get(message.channel.guild.ownerID)
    const embed = {
      description: `Information about ${message.channel.guild.name}`,
      color: 319403,
      fields: [{
        name: 'Name',
        value: `**${message.channel.guild.name}** (${message.channel.guild.id})`
      }, {
        name: 'Verification Level',
        value: `${message.channel.guild.verificationLevel}`
      }, {
        name: 'Owner',
        value: `${owner ? `**${owner.username}#${owner.discriminator}** ` : ''}(${message.channel.guild.ownerID})`
      }, {
        name: 'Features',
        value: message.channel.guild.features.length !== 0 ? message.channel.guild.features.join(', ') : 'No Guild Features'
      }, {
        name: 'Channels',
        value: `**${message.channel.guild.channels.size}** total\n**${message.channel.guild.channels.filter(c => c.type === 0).length}** text\n**${message.channel.guild.channels.filter(c => c.type === 2).length}** voice\n**${message.channel.guild.channels.filter(c => c.type === 4).length}** categories`
      }, {
        name: 'Region',
        value: `**${message.channel.guild.region}**`
      }, {
        name: 'Role Count',
        value: `${message.channel.guild.roles.size}`
      }]
    }
    if (message.channel.guild.iconURL) {
      embed.thumbnail = {
        url: message.channel.guild.iconURL
      }
    }
    if (message.channel.guild.emojis.length === 0) {
      fields.push({
        name: 'Emojis',
        value: 'None'
      })
      await message.channel.createMessage({ embeds: [embed] })
    } else {
      const emojiObj = {
        0: []
      }
      let counter = 0 // Dynamically create embed fields based on character count
      message.channel.guild.emojis.forEach(emoji => {
        if (emojiObj[counter].join('\n').length < 950) {
          if (!emoji.available) return
          emojiObj[counter].push(`<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}> ${escape(emoji.name)} ${emoji.roles.length !== 0 ? '<- 🔒 role restricted' : ''}`)
        } else {
          if (!emoji.available) return
          counter++
          emojiObj[counter] = []
          emojiObj[counter].push(`<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`)
        }
      })
      const emojiFields = Object.keys(emojiObj).map(key => {
        return {
          name: 'Emojis',
          value: emojiObj[key].join('\n'),
          inline: true
        }
      })
      for (let i = 0; i < emojiFields.length; i++) {
        if (!emojiFields[i]) break
        if (i % 4 !== 0) continue
        const emojiFieldsToUse = [emojiFields[i]]
        if (emojiFields[i + 1]) emojiFieldsToUse.push(emojiFields[i + 1])
        if (emojiFields[i + 2]) emojiFieldsToUse.push(emojiFields[i + 2])
        if (emojiFields[i + 3]) emojiFieldsToUse.push(emojiFields[i + 3])
        if (i === 0) {
          embed.fields = embed.fields.concat(emojiFieldsToUse)
          await message.channel.createMessage({ embeds: [embed] })
        } else {
          await message.channel.createMessage({ embeds: [{ description: 'Emojis continued', fields: emojiFieldsToUse }] })
        }
      }
    }
  },
  name: 'serverinfo',
  quickHelp: 'Use to get information about the current server (emojis, owner, member count, etc)',
  examples: `\`${process.env.GLOBAL_BOT_PREFIX}serverinfo\``,
  type: 'any',
  category: 'Utility'
}

module.exports = {
  name: 'serverinfo',
  func: async interaction => {
    const guild = global.bot.guilds.get(interaction.guildID)
    if (!guild) {
      global.logger.warn('Missing guild in serverinfo slash command')
      return
    }
    const fields = []
    let owner = global.bot.users.get(guild.ownerID)
    if (!owner) {
      try {
        owner = await global.bot.getRESTUser(guild.ownerID)
      } catch (_) {
        global.logger.warn('Failure to find guild owner in serverinfo') // not fatal, no need to terminate
      }
    }
    const embed = {
      description: `Information about ${guild.name}`,
      color: 319403,
      fields: [{
        name: 'Name',
        value: `**${guild.name}** (${guild.id})`
      }, {
        name: 'Verification Level',
        value: `${guild.verificationLevel}`
      }, {
        name: 'Owner',
        value: `${owner ? `**${owner.username}#${owner.discriminator}** ` : ''}(${guild.ownerID})`
      }, {
        name: 'Features',
        value: guild.features.length !== 0 ? guild.features.join(', ') : 'No Guild Features'
      }, {
        name: 'Channels',
        value: `**${guild.channels.size}** total\n**${guild.channels.filter(c => c.type === 0).length}** text\n**${guild.channels.filter(c => c.type === 2).length}** voice\n**${guild.channels.filter(c => c.type === 4).length}** categories`
      }, {
        name: 'Boost Count',
        value: `**${guild.premiumSubscriptionCount >= 0 ? guild.premiumSubscriptionCount : 'Unavailable'}**`
      }, {
        name: 'Role Count',
        value: `${guild.roles.size}`
      }]
    }
    if (guild.iconURL) {
      embed.thumbnail = {
        url: guild.iconURL
      }
    }
    if (guild.emojis.length === 0) {
      fields.push({
        name: 'Emojis',
        value: 'None'
      })
      interaction.createMessage({ embed }).catch(() => {})
    } else {
      const emojiObj = {
        0: []
      }
      let counter = 0 // Dynamically create embed fields based on character count
      guild.emojis.forEach(emoji => {
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
          interaction.createMessage({ embeds: [embed] }).catch(e => {
            global.logger.error('Failure to send a legal serverinfo embed', e)
          })
        } else {
          interaction.createMessage({ embeds: [{ description: 'Emojis continued', fields: emojiFieldsToUse }] }).catch(e => {
            global.logger.error('Failure to send serverinfo emoji continuation embed', e)
          })
        }
      }
    }
  }
}

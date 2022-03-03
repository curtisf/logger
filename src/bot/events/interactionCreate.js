const fs = require('fs')
const path = require('path')
const Eris = require('eris')

let slashCommands = fs.readdirSync(path.resolve('src', 'bot', 'slashcommands')).map(filename => {
  return require(path.resolve('src', 'bot', 'slashcommands', filename))
})

const waitingCustomIDs = new Map()
const waitingTimeouts = new Map()

module.exports = {
  name: 'interactionCreate',
  type: 'on',
  async handle (interaction) {
    if (interaction.applicationID !== global.bot.user.id) {
      return
    }
    if (interaction instanceof Eris.ComponentInteraction) {
      if (interaction.data.length !== 0 && waitingCustomIDs.has(interaction.data.custom_id)) {
        if (interaction.member.user.id === waitingCustomIDs.get(interaction.data.custom_id).userID) {
          global.bot.requestHandler.request('POST', `/interactions/${interaction.id}/${interaction.token}/callback`, true, {
            type: 6
          })
          waitingCustomIDs.get(interaction.data.custom_id).run(interaction)
        }
      }
    } else if (interaction instanceof Eris.CommandInteraction) {
      const channel = global.bot.getChannel(interaction.channel.id)
      if (!channel || !channel.permissionsOf(global.bot.user.id).json.viewChannel) return // no need to check send messages because replies are made using webhooks
      if (interaction.data.name === 'reloadinteractions' && interaction.member.user.id === process.env.CREATOR_IDS) {
        fs.readdirSync(path.resolve('src', 'bot', 'slashcommands')).forEach(filename => {
          delete require.cache[require.resolve(path.resolve('src', 'bot', 'slashcommands', filename))]
        })
        slashCommands = fs.readdirSync(path.resolve('src', 'bot', 'slashcommands')).map(filename => {
          return require(path.resolve('src', 'bot', 'slashcommands', filename))
        })
        await interaction.createMessage({ content: '🆗 reloaded slash commands', flags: Eris.Constants.MessageFlags.EPHEMERAL })
      }
      const command = slashCommands.find(c => c.name === interaction.data.name)
      if (command) {
        const guild = global.bot.guilds.get(interaction.guildID)
        if (guild) {
          global.logger.info(`${interaction.member.username}#${interaction.member.discriminator} (${interaction.member.id}) in ${interaction.channel.id} sent /${command.name}. The guild is called "${guild.name}", owned by ${guild.ownerID} and has ${guild.memberCount} members.`)
          try {
            command.func(interaction)
          } catch (commandError) {
            global.logger.error(commandError) // we do want this to reach sentry if failed
          }
        } else {
          global.logger.warn('Interaction was used but the guild ID sent is not in cache!')
        }
      }
    }
  },
  awaitCustomID (id, userIDToLock) {
    return new Promise((resolve, reject) => {
      waitingTimeouts.set(id, setTimeout(() => {
        waitingCustomIDs.delete(id)
        waitingTimeouts.delete(id)
        reject(new Error(`Custom ID ${id} did not receive a response.`))
      }, 60000))
      waitingCustomIDs.set(id, {
        userID: userIDToLock,
        run: (...toReturn) => {
          if (waitingTimeouts.has(id)) {
            clearTimeout(waitingTimeouts.get(id))
            waitingTimeouts.delete(id)
          }
          resolve(...toReturn)
        }
      })
    })
  }
}

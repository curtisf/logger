const fs = require('fs')
const path = require('path')
const Eris = require('eris')
const { EMBED_COLORS } = require('../utils/constants')
const { getEmbedFooter, getAuthorField } = require('../utils/embeds')
const { NewsThreadChannel, PrivateThreadChannel, PublicThreadChannel } = require('eris')

let slashCommands = fs.readdirSync(path.resolve('src', 'bot', 'slashcommands')).map(filename => {
  return require(path.resolve('src', 'bot', 'slashcommands', filename))
})

const waitingCustomIDs = new Map()
const waitingTimeouts = new Map()

module.exports = {
  name: 'interactionCreate',
  type: 'on',
  handle (interaction) {
    return new Promise((resolve, reject) => { // why use a promise? awaitCustomID and handle are still sync and can share the timeout/callback maps nicely?
      if (interaction.applicationID !== global.bot.user.id) {
        resolve()
      }
      if (interaction instanceof Eris.ComponentInteraction) {
        if (interaction.data.custom_id && waitingCustomIDs.has(interaction.data.custom_id)) {
          if (interaction.member.user.id === waitingCustomIDs.get(interaction.data.custom_id).userID) {
            interaction.acknowledge().catch(() => {}).then(() => {
              waitingCustomIDs.get(interaction.data.custom_id).run(interaction)
              resolve()
            })
          }
        }
      } else if (interaction instanceof Eris.CommandInteraction) {
        const channel = global.bot.getChannel(interaction.channel.id)
        if (!channel || !channel.permissionsOf(global.bot.user.id).json.viewChannel || channel instanceof Eris.TextVoiceChannel) return // no need to check send messages because replies are made using webhooks
        if (interaction.data.name === 'reloadinteractions' && interaction.member.user.id === process.env.CREATOR_IDS) {
          fs.readdirSync(path.resolve('src', 'bot', 'slashcommands')).forEach(filename => {
            delete require.cache[require.resolve(path.resolve('src', 'bot', 'slashcommands', filename))]
          })
          slashCommands = fs.readdirSync(path.resolve('src', 'bot', 'slashcommands')).map(filename => {
            return require(path.resolve('src', 'bot', 'slashcommands', filename))
          })
          interaction.createMessage({ content: '🆗 reloaded slash commands', flags: Eris.Constants.MessageFlags.EPHEMERAL }).catch(() => {})
          resolve()
        }
        const command = slashCommands.find(c => c.name === interaction.data.name)
        if (command) {
          if (command.noThread && (interaction.channel instanceof NewsThreadChannel || interaction.channel instanceof PrivateThreadChannel || interaction.channel instanceof PublicThreadChannel)) {
            interaction.createMessage({
              embeds: [{
                title: 'Unable to run',
                color: EMBED_COLORS.YELLOW_ORANGE,
                description: `__${command.name}__ cannot be ran in a thread.`,
                footer: getEmbedFooter(global.bot.user),
                author: getAuthorField(interaction.member.user),
                thumbnail: {
                  url: interaction.member.user.dynamicAvatarURL(null, 64)
                }
              }],
              flags: Eris.Constants.MessageFlags.EPHEMERAL
            }).catch(() => {})
            return
          }
          if (command.userPerms && command.userPerms.length !== 0) {
            const userChannelPerms = interaction.channel.permissionsOf(interaction.member.user.id).json
            const missingPermissions = command.userPerms.filter(bpName => !userChannelPerms[bpName])
            if (missingPermissions.length !== 0) {
              interaction.createMessage({
                embeds: [{
                  title: 'Missing Permissions',
                  color: EMBED_COLORS.YELLOW_ORANGE,
                  description: `You are missing the following permissions to run ${command.name}: ${missingPermissions.map(perm => `\`${perm}\``).join(', ')}`,
                  footer: getEmbedFooter(global.bot.user),
                  author: getAuthorField(interaction.member.user),
                  thumbnail: {
                    url: interaction.member.user.dynamicAvatarURL(null, 64)
                  }
                }],
                flags: Eris.Constants.MessageFlags.EPHEMERAL
              }).catch(() => {})
              return
            }
          }
          if (command.botPerms && command.botPerms.length !== 0) {
            const botChannelPermissions = interaction.channel.permissionsOf(global.bot.user.id).json
            const missingPermissions = command.botPerms.filter(bpName => !botChannelPermissions[bpName])
            if (missingPermissions.length !== 0) {
              interaction.createMessage({
                embeds: [{
                  title: 'Bot Missing Permissions',
                  color: EMBED_COLORS.YELLOW_ORANGE,
                  description: `I need the following permissions to run ${command.name}: ${missingPermissions.map(perm => `\`${perm}\``).join(', ')}`,
                  footer: getEmbedFooter(global.bot.user),
                  author: getAuthorField(interaction.member.user),
                  thumbnail: {
                    url: global.bot.user.dynamicAvatarURL(null, 64)
                  }
                }],
                flags: Eris.Constants.MessageFlags.EPHEMERAL
              }).catch(() => {})
              return
            }
          }
          const guild = global.bot.guilds.get(interaction.guildID)
          if (guild) {
            global.logger.info(`${interaction.member.username}#${interaction.member.discriminator} (${interaction.member.id}) in ${interaction.channel.id} sent /${command.name}. The guild is called "${guild.name}", owned by ${guild.ownerID} and has ${guild.memberCount} members.`)
            try {
              command.func(interaction)
            } catch (commandError) {
              global.logger.error(commandError) // we do want this to reach sentry if failed
              resolve() // it hurts to use a promise like this
            }
          } else {
            global.logger.warn('Interaction was used but the guild ID sent is not in cache!')
          }
        }
      }
    })
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
            waitingCustomIDs.delete(id)
          }
          resolve(...toReturn)
        }
      })
    })
  }
}

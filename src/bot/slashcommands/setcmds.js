const path = require('path')

module.exports = {
  name: 'setcmds',
  type: 'creator',
  func: async interaction => {
    if (require.cache[path.resolve('src', 'bot', 'utils', 'slashcommandconstants.js')]) {
      delete require.cache[path.resolve('src', 'bot', 'utils', 'slashcommandconstants.js')]
    }
    const { developerCommands, commands } = require('../utils/slashcommandconstants')
    try {
        if (interaction.data?.options?.find(o => o.name === 'scope')?.value === 'guild') {
          await global.bot.bulkEditGuildCommands(interaction.channel.guild.id, [...commands, ...developerCommands])
          interaction.createMessage(`Guild set ${[...commands, ...developerCommands].length} slash commands successfully`)
          global.logger.info(`Guild set ${[...commands, ...developerCommands].length} slash commands successfully`)
        } else if (interaction.data?.options?.find(o => o.name === 'scope')?.value === 'global') {
          await global.bot.bulkEditCommands(commands)
          interaction.createMessage(`Globally set ${commands.length} slash commands successfully`)
          global.logger.info(`Globally set ${commands.length} slash commands successfully`)
        } else {
          interaction.createMessage('Incorrect usage, options are guild or global.')
        }
      } catch (e) {
        global.logger.error('Error setting guild slash commands', e)
        interaction.createMessage(`Error setting slash commands:\n${e?.message}`)
      }
  }
}

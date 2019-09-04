class GenericCommand {
  constructor (data) {
    if (data.disabled) return
    if (!data.name) global.logger.fatal('A command is missing a name! Verify all commands are properly structured and try again.')
    else if (!data.func) global.logger.fatal(`Command ${data.name} doesn't have a function to execute!`)
    else if (!data.description) {
      global.logger.error(`Command ${data.name} is missing a description.`)
      data.description = 'None provided'
    }

    this.name = data.name
    this.description = data.description
    this.func = data.func
    this.aliases = data.aliases || []
    this.args = data.args || []
    this.noDM = data.noDM || true
    this.perm = data.perm
    this.type = data.type || 'any'
    this.category = data.category || 'Uncategorized'
    this.hidden = data.hidden ? true : false

    global.bot.commands[data.name] = this
  }

  run (msg) {
    return this.func(msg)
  }
}

module.exports = GenericCommand

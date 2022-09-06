class GenericCommand {
  constructor (data) {
    if (data.disabled) return
    if (!data.name) global.logger.fatal('A command is missing a name! Verify all commands are properly structured and try again.')
    else if (!data.func) global.logger.fatal(`Command ${data.name} doesn't have a function to execute!`)

    if (!data.quickHelp && !data.hidden) {
      global.logger.warn(`Command ${data.name} is missing a quick help section.`)
      data.quickHelp = 'None provided'
    }

    if (!data.examples && !data.hidden) {
      global.logger.warn(`Command ${data.name} is missing examples.`)
      data.examples = 'None provided'
    }

    this.name = data.name
    this.quickHelp = data.quickHelp
    this.examples = data.examples
    this.func = data.func
    this.args = data.args || []
    this.noDM = data.noDM || true
    this.perm = data.perm // single perm (should probably just move to using perms: ['perm'])
    this.perms = data.perms // multiple perms 
    this.type = data.type || 'any'
    this.hidden = !!data.hidden
    this.noThread = !!data.noThread

    global.bot.commands[data.name] = this
  }

  run (msg) {
    return this.func(msg)
  }
}

module.exports = GenericCommand

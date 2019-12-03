const statAggregator = require('./statAggregator')

module.exports = async message => {
  if (message.author.bot || !message.member) return
  if (message.content.startsWith(process.env.GLOBAL_BOT_PREFIX)) {
    const cmd = message.content.substring(process.env.GLOBAL_BOT_PREFIX.length).split(' ')[0].toLowerCase()
    const splitSuffix = message.content.substr(process.env.GLOBAL_BOT_PREFIX).split(' ')
    const suffix = splitSuffix.slice(1, splitSuffix.length).join(' ')
    processCommand(message, cmd, suffix)
  }
}

function processCommand (message, commandName, suffix) {
  const command = Object.keys(global.bot.commands).map(k => global.bot.commands[k]).find(c => c.name === commandName)
  if (!command) return
  const bp = message.channel.guild.members.get(global.bot.user.id).permission.json
  if (!bp.readMessages || !bp.sendMessages || !bp.manageWebhooks) return
  if ((command.noDM || command.perm || command.type === 'admin') && !message.channel.guild) {
    message.channel.createMessage('You cannot use this command in a DM!')
    return
  } else if (message.author.id === process.env.CREATOR_IDS) {
    global.logger.info(`Developer override by ${message.author.username}#${message.author.discriminator} at ${new Date().toUTCString()}`)
    command.func(message, suffix)
    return
  } else if (command.type === 'creator' && !process.env.CREATOR_IDS.includes(message.author.id)) {
    message.channel.createMessage('This command is creator only!')
    return
  } else if (command.type === 'admin' && !(message.member.permission.has('administrator' || message.author.id === message.channel.guild.ownerID))) {
    message.channel.createMessage('That\'s an admin only command. You need the administrator permission to use it.')
    return
  } else if (command.perm && !(message.member.permission.has(command.perm) || message.author.id === message.channel.guild.ownerID)) {
    message.channel.createMessage(`This command requires you to be the owner of the server, or have the ${command.perm} permission.`)
    return
  }
  global.logger.info(`${message.author.username}#${message.author.discriminator} (${message.author.id}) in ${message.channel.id} sent ${commandName} with the args "${suffix}". The guild is called "${message.channel.guild.name}", owned by ${message.channel.guild.ownerID} and has ${message.channel.guild.members.size} members.`)
  statAggregator.incrementCommand(command.name)
  command.func(message, suffix)
}

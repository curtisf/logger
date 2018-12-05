module.exports = async (message) => {
  if (message.author.bot || !message.member) return
  if (global.bot.guildPrefixes[message.channel.guild.id] && global.bot.guildPrefixes[message.channel.guild.id].length !== 0) {
    // premium logic
    /*
        let cmd = msg.content.substring(prefix.length).split(' ')[0].toLowerCase()
    let splitSuffix = msg.content.substr(Config.core.prefix.length).split(' ')
    let suffix = splitSuffix.slice(1, splitSuffix.length).join(' ')
    */
  } else if (message.content.startsWith(process.env.GLOBAL_BOT_PREFIX)) {
    let cmd = message.content.substring(process.env.GLOBAL_BOT_PREFIX.length).split(' ')[0].toLowerCase()
    let splitSuffix = message.content.substr(process.env.GLOBAL_BOT_PREFIX).split(' ')
    let suffix = splitSuffix.slice(1, splitSuffix.length).join(' ')
    processCommand(message, cmd, suffix)
  }
}

function processCommand (message, commandName, suffix) {
  let command = Object.keys(bot.commands).map(k => bot.commands[k]).find(c => c.name === commandName)
  if (!command) return
  let bp = message.channel.guild.members.get(global.bot.user.id).permission.json
  if (!bp.readMessages || !bp.sendMessages || !bp.manageWebhooks) return
  if ((command.noDM || command.perm || command.type === 'admin') && !message.channel.guild) {
    message.channel.createMessage('You cannot use this command in a DM!')
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
  command.func(message, suffix)
}

const checkForMissingSettings = require('../utils/recoverSettings')
const statAggregator = require('../modules/statAggregator')

module.exports = {
  name: 'ready',
  type: 'once',
  handle: async () => {
    console.info('Ready to go!')
    global.signale.complete(`Ready. I am ${global.bot.user.username}#${global.bot.user.discriminator}, in ${global.bot.guilds.size} servers.\nInvite me here:\nhttps://discord.com/oauth2/authorize?client_id=${global.bot.user.id}&scope=bot&permissions=536988833\nUse '${global.envInfo.GLOBAL_BOT_PREFIX}setcmd global' to get slash commands to appear`)
    global.bot.editStatus('online', {
      name: 'LoggerBot selfhost.'
    })
    if (global.bot.shards.find(s => s.id === 0)) { // only check for missing settings once
      await checkForMissingSettings()
    }
  }
}

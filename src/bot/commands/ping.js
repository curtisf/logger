module.exports = {
  func: async message => {
    const start = new Date().getTime()
    const m = await message.channel.createMessage('Fetching...')
    m.edit(`Done. RTT: ${new Date().getTime() - start}`)
  },
  name: 'ping',
  quickHelp: 'Get Logger\'s round-trip time to Discord.',
  examples: `\`${global.envInfo.GLOBAL_BOT_PREFIX}ping\``,
  type: 'any',
  category: 'General'
}

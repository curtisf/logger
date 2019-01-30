module.exports = {
  func: async message => {
    const start = new Date().getTime()
    const m = await message.channel.createMessage('Fetching...')
    m.edit(`Done. RTT: ${new Date().getTime() - start}`)
  },
  name: 'ping',
  description: 'Get Logger\'s round-trip time to Discord.',
  type: 'any',
  category: 'General'
}

module.exports = {
  func: async message => {
    let start = new Date().getTime()
    let m = await message.channel.createMessage('Fetching...')
    m.edit(`Done. RTT: ${new Date().getTime() - start}`)
  },
  name: 'ping',
  description: 'Get Logger\'s round-trip time to Discord.',
  type: 'any',
  category: 'General'
}

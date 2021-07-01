module.exports = {
  func: async (message, suffix) => {
    const os = require('os-utils')

    os.cpuUsage(async v => {
      await message.channel.createMessage(`[${cluster.worker.rangeForShard}] CPU usage: ${v * 100}%`)
    })
    os.cpuFree(async v => {
      await message.channel.createMessage(`[${cluster.worker.rangeForShard}] CPU free: ${v * 100}%`)
    })
  },
  name: 'getcpu',
  description: 'Bot owner debug command.',
  type: 'creator',
  hidden: true
}

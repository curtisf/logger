module.exports = {
  func: async (message, suffix) => {
    if (suffix === 'clear') {
      process.send({
        type: 'debugActivity',
        data: 'clear'
      })
    } else {
      process.send({
        type: 'debugActivity',
        data: 'show'
      })
    }
  },
  name: 'getmostactiveguilds',
  description: 'Bot owner debug command.',
  type: 'creator',
  hidden: true
}

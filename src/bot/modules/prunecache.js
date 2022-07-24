const send = require('../modules/webhooksender')
const request = require('superagent')

module.exports = {
  cache: {},
  handle (logID, guild, member, perp) {
    if (!this.cache.hasOwnProperty(logID)) {
      this.cache[logID] = {
        count: 0,
        guild,
        list: `${new Date((logID / 4194304) + 1420070400000).toUTCString()}\n`,
        perp
      }
      setTimeout(async () => {
        this.send(logID)
      }, 10000)
    }
    this.cache[logID].list += `\n${member.username}#${member.discriminator} (${member.id})`
    this.cache[logID].count++
  },
  async send (logID) {
  }
}

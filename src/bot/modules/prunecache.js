const send = require('../modules/webhooksender')
const request = require('superagent')

module.exports = {
  cache: {},
  handle (logID, guild, member, perp) {
    if (!this.cache.hasOwnProperty(logID)) {
      this.cache[logID] = {
        count: 0,
        guild,
        list: `${new Date((logID / 4194304) + 1420070400000).toString()}\n`,
        perp
      }
      setTimeout(async () => {
        this.send(logID)}, 10000)
    }
    this.cache[logID].list += `\n${member.username}#${member.discriminator} (${member.id})`
    this.cache[logID].count++
  },
  async send (logID) {
    const log = this.cache[logID]
    delete this.cache[logID]
    let res
    try {
      res = await request
        .post('https://paste.lemonmc.com/api/json/create')
        .send({
          data: log.list,
          language: 'text',
          private: true,
          title: log.guild.name.slice(0, 29),
          expire: '2592000'
        })

      if (res.statusCode === 200 && res.body.result.id) {
        res = `[${log.count} members](https://paste.lemonmc.com/${res.body.result.id}/${res.body.result.hash})`
      } else {
        console.error(res)
        res = `${log.count} members`
      }
    } catch (err) {
      console.error(err)
      res = `${log.count} members`
    }
    const event = {
      guildID: log.guild.id,
      eventName: 'guildMemberKick',
      embed: {
        author: {
          name: `${log.perp.username}#${log.perp.discriminator}`,
          icon_url: log.perp.avatarURL
        },
        color: 16711680,
        description: `${res} were pruned`,
        fields: [{
          name: 'ID',
          value: `\`\`\`ini\nPerpetrator = ${log.perp.id}\`\`\``
        }]
      }
    }
    await send(event)
  }
}

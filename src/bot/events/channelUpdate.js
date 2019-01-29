const send = require('../modules/webhooksender')

module.exports = {
  name: 'channelUpdate',
  type: 'on',
  handle: async (channel, old) => {
    let embed = {
      guildID: channel.guild.id,
      eventName: 'channelUpdate',
      embed: {
        author: {
          name: 'Unknown',
          icon_url: 'http://laoblogger.com/images/outlook-clipart-red-x-10.jpg'
        },
        description: `Channel <#${channel.id}> updated`,
        fields: [{
          name: 'Name',
          value: channel.name
        }, {
          name: 'ID',
          value: `\`\`\`ini\nUser = Unknown\nChannel = ${channel.id}\`\`\``
        }],
        color: 3553599
      }
    }
    let possibleChanges = Object.keys(old)
    let toProcess = []
    if (old.topic === null) old.topic = '' // Inconsistency with Eris.
    possibleChanges.forEach((property) => {
      if (property !== 'permissionOverwrites') {
        if (channel[property] !== old[property]) toProcess.push(property)
      } else if (channel.permissionOverwrites.map(o => `${o.allow}|${o.deny}`).join(' ') !== old.permissionOverwrites.map(o => `${o.allow}|${o.deny}`).join(' ')) toProcess.push('permissionOverwrites')
    })
    toProcess.forEach((property) => {
      if (property !== 'permissionOverwrites') {
        embed.embed.fields.push({
          name: property,
          value: `Now: ${channel[property]}\nPreviously: ${old[property]}`
        })
      }
    })
    await setTimeout(async () => {
      let logs = await channel.guild.getAuditLogs(1, null, 11)
      let log = logs.entries[0]
      let user = logs.users[0]
      if (new Date().getTime() - new Date((log.id / 4194304) + 1420070400000).getTime() < 3000) { // if the audit log is less than 3 seconds off
        embed.embed.author.name = `${user.username}#${user.discriminator}`
        embed.embed.author.icon_url = user.avatarURL
        embed.embed.fields[1].value = `\`\`\`ini\nUser = ${user.id}\nChannel = ${channel.id}\`\`\``
        await send(embed)
      } else {
        await send(embed)
      }
    }, 1000)
  }
}

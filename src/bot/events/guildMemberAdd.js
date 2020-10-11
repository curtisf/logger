const send = require('../modules/webhooksender')
const inviteCache = require('../modules/invitecache')

// I hate this code so, so, so much. Everyday it continues to run in the bot makes me angrier.

module.exports = {
  name: 'guildMemberAdd',
  type: 'on',
  handle: async (guild, member) => {
    if (!guild.members.get(global.bot.user.id).permissions.json.manageGuild) return
    const GMAEvent = {
      guildID: guild.id,
      eventName: 'guildMemberAdd',
      embed: {
        author: {
          name: `${member.username}#${member.discriminator}`,
          icon_url: member.avatarURL
        },
        description: `<@${member.id}> joined `,
        fields: [{
          name: 'Name',
          value: `${member.username}#${member.discriminator} (${member.id}) ${member.mention}`
        }, {
          name: 'Joined At',
          value: new Date().toUTCString()
        }, {
          name: 'Account Age',
          value: `**${Math.floor((new Date() - member.user.createdAt) / 86400000)}** days`,
          inline: true
        },
        {
          name: 'Member Count',
          value: guild.memberCount,
          inline: true
        }],
        color: 65280
      }
    }
    if (!member.username) { // No username? nope.
      return
    }
    let guildInvites
    try {
      guildInvites = await guild.getInvites()
      const cachedInvites = await inviteCache.getCachedInvites(guild.id)
      guildInvites = guildInvites.map(invite => `${invite.code}|${invite.hasOwnProperty('uses') ? invite.uses : 'Infinite'}`)
      const usedInviteStr = compareInvites(guildInvites, cachedInvites)
      if (!usedInviteStr) {
        if (guild.features.includes('VANITY_URL')) {
          GMAEvent.embed.fields.push({
            name: 'Invite Used',
            value: 'The discord.gg url defined by the guild owner (or admin)',
            inline: true
          })
        } else if (member.bot) {
          GMAEvent.embed.fields.push({
            name: 'Invite Used',
            value: 'OAuth flow',
            inline: true
          })
        }
      }
      if (usedInviteStr) {
        const split = usedInviteStr.split('|')
        const usedInvite = {
          code: split[0],
          uses: split[1]
        }
        GMAEvent.embed.fields.push({
          name: 'Invite Used',
          value: `${usedInvite.code} with ${usedInvite.uses} uses`,
          inline: true
        })
      }
      await inviteCache.cacheInvites(guild.id, guildInvites)
    } catch (_) {
      console.error(_)
      // They're denying the bot the permissions it needs.
    }
    GMAEvent.embed.fields.push({
      name: 'ID',
      value: `\`\`\`ini\nMember = ${member.id}\nGuild = ${guild.id}\`\`\``
    })
    await send(GMAEvent)
  }
}

function compareInvites (current, saved) {
  let i = 0
  for (i = 0; i < current.length; i++) {
    if (current[i] !== saved[i]) return current[i]
  }
  return null
}

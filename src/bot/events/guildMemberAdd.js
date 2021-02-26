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
      guildInvites = (await guild.getInvites()).map(i => inviteCache.formatInvite(i, false))
      const cachedInvites = await inviteCache.getCachedInvites(guild.id)
      let usedInvite
      if (guildInvites.length > cachedInvites.length) {
        // invite desync between redis and Discord, fix it
        await inviteCache.cacheInvitesWhole(guild.id, guildInvites)
      } else {
        usedInvite = compareInvites(guildInvites, cachedInvites)
      }
      if (!usedInvite) {
        if (guild.features.includes('VANITY_URL')) {
          GMAEvent.embed.fields.push({
            name: 'Invite Used',
            value: 'Server vanity',
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
      if (usedInvite) {
        GMAEvent.embed.fields.push({
          name: 'Invite Used',
          value: `${usedInvite.code} with ${usedInvite.uses} uses`,
          inline: true
        })
      }
      await inviteCache.cacheInvitesWhole(guild.id, guildInvites)
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
  if (current.length === saved.length) {
    for (let i = 0; i < current.length; i++) {
      const matchedInvite = saved.find(inv => (inv.code === current[i].code) && (inv.uses !== current[i].uses))
      if (matchedInvite) return current[i]
    }
  } else {
    for (let i = 0; i < saved.length; i++) {
      if (!current.find(inv => inv.code === saved[i].code)) {
        return saved[i]
      }
    }
  }
  saved.forEach(savedInvite => {
    if (current.indexOf(savedInvite) !== -1) {
      current.splice(current.indexOf(savedInvite), 1)
    }
  })
}

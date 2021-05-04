const send = require('../modules/webhooksender')
const inviteCache = require('../modules/invitecache')

module.exports = {
  name: 'guildMemberAdd',
  type: 'on',
  requiredPerms: ['manageGuild', 'manageChannels'], // manageGuild -> fetch invites, manageChannels -> receive INVITE_CREATE & INVITE_DELETE
  handle: async (guild, member) => {
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
      guildInvites = (await guild.getInvites()).map(i => inviteCache.formatInvite(i))
      const cachedInvites = await inviteCache.getCachedInvites(guild.id)
      let usedInvite
      if (guildInvites.length > cachedInvites.length) {
        // invite desync between redis and Discord, fix it
        await inviteCache.cacheInvites(guild.id, guildInvites)
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
  const toIter = (current.length >= saved.length ? current : saved)
  for (let i = 0; i < toIter.length; i++) {
    const savedInvite = saved.find(inv => inv.code === toIter[i].code)
    const currentInvite = current.find(inv => inv.code === toIter[i].code)
    if (!savedInvite || !currentInvite) return null // if either is missing we shouldn't compare whatsoever
    if (savedInvite.uses !== currentInvite.uses) {
      return toIter[i]
    }
  }
}

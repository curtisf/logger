const send = require('../modules/webhooksender')
const inviteCache = require('../modules/invitecache')
const getUser = require('../../db/interfaces/postgres/read').getUser

module.exports = {
  name: 'guildMemberAdd',
  type: 'on',
  handle: async (guild, member) => {
    if (!guild.members.get(global.bot.user.id).permission.json['manageGuild']) return
    const dbUser = await getUser(member.id)
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
          value: new Date().toString()
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
      let cachedInvites = await inviteCache.getCachedInvites(guild.id)
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
    if (dbUser.names.includes('placeholder')) {
      dbUser.names.splice(dbUser.names.indexOf('placeholder'), 1)
    }
    if (dbUser.names.length !== 0) {
      GMAEvent.embed.fields.push({
        name: 'Last Names',
        value: `\`\`\`${dbUser.names.join(', ').substr(0, 1000)}\`\`\``
      })
    }
    await send(GMAEvent)
  }
}

function compareInvites(current, saved) {
  let i = 0
  for (i = 0; i < current.length; i++) {
    if (current[i] !== saved[i]) return current[i]
  }
  return null
}

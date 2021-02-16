const inviteCache = require('../modules/invitecache')

module.exports = {
    name: 'inviteDelete',
    type: 'on',
    handle: async (guild, invite) => {
      setTimeout(async () => { 
        // wait for guildMemberAdd logic to fire (or harmlessly wait on manual invite deletion)

        // guildMemberAdd updates the invite cache before this call happens BUT
        // manual invite deletion still needs to be considered
        await inviteCache.deleteInvite(guild.id, invite.code)
      }, 2000)
    }
  }
  
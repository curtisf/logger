const inviteCache = require('../modules/invitecache')

module.exports = {
  name: 'inviteCreate',
  type: 'on',
  handle: async (guild, invite) => {
    await inviteCache.insertInvite(guild.id, invite)
  }
}

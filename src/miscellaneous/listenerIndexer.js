const fs = require('fs')
const path = require('path')

module.exports = () => {
  const files = [require('../bot/events/inviteCreate'), require('../bot/events/inviteDelete'), require('../bot/events/channelCreate.js'), require('../bot/events/channelDelete.js'), require('../bot/events/channelUpdate.js'), require('../bot/events/disconnect.js'), require('../bot/events/error.js'), require('../bot/events/guildBanAdd.js'), require('../bot/events/guildBanRemove.js'), require('../bot/events/guildCreate.js'), require('../bot/events/guildDelete.js'), require('../bot/events/guildMemberAdd.js'), require('../bot/events/guildMemberRemove.js'), require('../bot/events/guildMemberUpdate.js'), require('../bot/events/guildRoleCreate.js'), require('../bot/events/guildRoleDelete.js'), require('../bot/events/guildRoleUpdate.js'), require('../bot/events/guildUpdate.js'), require('../bot/events/messageCreate.js'), require('../bot/events/messageDelete.js'), require('../bot/events/messageDeleteBulk.js'), require('../bot/events/messageUpdate.js'), require('../bot/events/ready.js'), require('../bot/events/voiceChannelJoin.js'), require('../bot/events/voiceChannelLeave.js'), require('../bot/events/voiceChannelSwitch.js'), require('../bot/events/voiceStateUpdate.js')]
  const once = []
  const on = []
  files.forEach(filename => {
    const event = filename
    event.name = event.name.replace('.js', '')
    if (event.type === 'once') {
      once.push({ name: event.name, handle: event.handle })
    } else {
      on.push({ name: event.name, handle: event.handle, ...(event.requiredPerms?.length ? { requiredPerms: event.requiredPerms } : {}) })
    }
  })
  return [on, once]
}

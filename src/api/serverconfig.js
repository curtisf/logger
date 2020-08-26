const getDoc = require('../db/interfaces/sqlite').getGuild

const eventTooltips = {
  channelCreate: 'When a channel is created.',
  channelUpdate: 'When a channel property (name, overrides) is updated.',
  channelDelete: 'When a channel is deleted.',
  guildBanAdd: 'When a guild member gets banned.',
  guildBanRemove: 'When a guild member gets unbanned.',
  guildRoleCreate: 'When a role is created.',
  guildRoleDelete: 'When a role is deleted.',
  guildRoleUpdate: 'When a role is updated (permissions).',
  guildUpdate: 'When a guild property is updated (name, afk channel, welcome channel, etc).',
  messageDelete: 'When a text message in a non-ignored channel is deleted.',
  messageDeleteBulk: 'When a message purge happens (on ban, some modbots).',
  messageReactionRemoveAll: 'When someone removes all reactions from a cached message.',
  messageUpdate: 'When a message is edited.',
  guildMemberAdd: 'When a member joins the guild.',
  guildMemberKick: 'When a member is kicked from the guild.',
  guildMemberRemove: 'When a member leaves by their own choice.',
  guildMemberUpdate: 'When a member is updated (roles, nickname).',
  guildMemberNickUpdate: 'When a member\'s nickname is changed',
  voiceChannelLeave: 'When a member leaves a voice channel.',
  voiceChannelJoin: 'When a member joins a voice channel.',
  voiceStateUpdate: 'When a member in a voice channel is muted or deafened by another guild member.',
  voiceChannelSwitch: 'When a member moves from one voice channel to another.',
  guildEmojisUpdate: 'When an emoji gets uploaded, deleted, or updated.'
}

const allEvents = [
  'channelCreate',
  'channelUpdate',
  'channelDelete',
  'guildBanAdd',
  'guildBanRemove',
  'guildRoleCreate',
  'guildRoleDelete',
  'guildRoleUpdate',
  'guildUpdate',
  'messageDelete',
  'messageDeleteBulk',
  'messageReactionRemoveAll',
  'messageUpdate',
  'guildMemberAdd',
  'guildMemberKick',
  'guildMemberRemove',
  'guildMemberUpdate',
  'guildMemberNickUpdate',
  'voiceChannelLeave',
  'voiceChannelJoin',
  'voiceStateUpdate',
  'voiceChannelSwitch',
  'guildEmojisUpdate']

module.exports = (req, res) => {
  if (global.bot.guilds.get(req.params.id)) {
    let selectedChannels = {}
    getDoc(req.params.id).then((doc) => {
      const channels = global.bot.guilds.get(req.params.id).channels.map(c => c).filter(c => c.type === 0)
      const eventInfo = {}
      selectedChannels = {}
      Object.keys(doc.event_logs).forEach((key) => {
        if (doc.event_logs[key]) {
          const channel = channels.find(c => c.id === doc.event_logs[key])
          if (channel) {
            selectedChannels[key] = {
              id: channel.id,
              name: channel.name
            }
          }
        }
      })
      allEvents.forEach((event) => {
        if (doc.disabled_events.includes(event)) {
          eventInfo[event] = {
            disabled: true,
            name: event,
            tooltip: eventTooltips[event]
          }
        } else {
          eventInfo[event] = {
            disabled: false,
            name: event,
            tooltip: eventTooltips[event]
          }
        }
      })
      res.render('configure', { channels: channels, guildID: req.params.id, selectedChannels: selectedChannels, guildName: global.bot.guilds.get(req.params.id).name, allEvents: allEvents, toggledEvents: eventInfo })
    })
  } else {
    res.render('error', { code: '404', message: 'Guild not found!' })
  }
}

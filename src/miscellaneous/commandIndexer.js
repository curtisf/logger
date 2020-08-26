const fs = require('fs')
const path = require('path')
const GenericCommand = require('../bot/bases/GenericCommand')

module.exports = () => {
  const files = [require('../bot/commands/archive.js'), require('../bot/commands/clearchannel.js'), require('../bot/commands/clearmydata.js'), require('../bot/commands/eval.js'), require('../bot/commands/help.js'), require('../bot/commands/ignorechannel.js'), require('../bot/commands/info.js'), require('../bot/commands/invite.js'), require('../bot/commands/logbots.js'), require('../bot/commands/ping.js'), require('../bot/commands/reset.js'), require('../bot/commands/serverinfo.js'), require('../bot/commands/setchannel.js'), require('../bot/commands/userinfo.js')]
  files.forEach(file => {
    new GenericCommand(file)
  })
}

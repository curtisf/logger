global.logger = require('./src/miscellaneous/logger')
global.webhook = require('./src/miscellaneous/webhooklogger')
global.cluster = require('cluster')
require('./src/miscellaneous/logger')
require('dotenv').config()
if (cluster.isMaster) {
  console.log('Master node init')
  require('./primary')
} else {
  require('./replica')
}

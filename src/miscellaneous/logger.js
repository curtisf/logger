const chalk = require('chalk')
const raven = require('raven')
raven.config(global.envInfo.RAVEN_URI, { parseUser: false })

module.exports = {
  startup: info => console.log(chalk`${new Date().toUTCString()} {bold.whiteBright.bgBlue STARTUP} ${info}`),
  fatal: info => {
    console.log(chalk`${new Date().toUTCString()} {bold.white.bgRed FATAL}: ${info}`)
    process.exit()
  },
  error: info => {
    console.log(chalk`${new Date().toUTCString()} {bold.red ERROR}: ${info}`)
    raven.captureMessage(info)
  },
  warn: info => console.log(chalk`${new Date().toUTCString()} {bold.yellow WARN}: ${info}`),
  info: info => console.log(chalk`${new Date().toUTCString()} {bold.blue INFO}: {white ${info}}`)
}

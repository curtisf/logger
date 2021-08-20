const chalk = require('chalk')
const Sentry = require('@sentry/node')

if (process.env.SENTRY_URI) {
  Sentry.init({
    dsn: process.env.SENTRY_URI
  })
}

module.exports = {
  startup: info => console.log(chalk`${new Date().toUTCString()} {bold.whiteBright.bgBlue STARTUP} ${info}`),
  fatal: info => {
    console.log(chalk`${new Date().toUTCString()} {bold.white.bgRed FATAL}: ${info}`)
    Sentry.captureMessage(info)
    process.exit()
  },
  error: info => {
    console.log(chalk`${new Date().toUTCString()} {bold.red ERROR}: ${info}`)
    Sentry.captureException(info)
  },
  warn: info => console.log(chalk`${new Date().toUTCString()} {bold.yellow WARN}: ${info}`),
  info: info => console.log(chalk`${new Date().toUTCString()} {bold.blue INFO}: {white ${info}}`)
}

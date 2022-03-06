const chalk = require('chalk')
const Sentry = require('@sentry/node')

if (process.env.SENTRY_URI) {
  Sentry.init({
    dsn: process.env.SENTRY_URI
  })
}

module.exports = {
  startup: (...info) => console.log(chalk`${new Date().toUTCString()} {bold.whiteBright.bgBlue STARTUP} `, ...info),
  fatal: (...info) => {
    console.log(chalk`${new Date().toUTCString()} {bold.white.bgRed FATAL}: `, ...info)
    Sentry.captureMessage(info.find(e => e instanceof Error) || info)
    process.exit()
  },
  error_nosentry: (...info) => {
    console.log(chalk`${new Date().toUTCString()} {bold.red ERROR(no sentry)}: `, ...info)
  },
  error: (...info) => {
    console.log(chalk`${new Date().toUTCString()} {bold.red ERROR}: `, ...info)
    Sentry.captureException(info.find(e => e instanceof Error) || info)
  },
  warn: (...info) => console.log(chalk`${new Date().toUTCString()} {bold.yellow WARN}: `, ...info),
  info: (...info) => console.log(chalk`${new Date().toUTCString()} {bold.blue INFO}: `, ...info.map(m => chalk`{white ${m}}`)),
  debug: (...info) => console.log(chalk`${new Date().toUTCString()} {bgGreen DEBUG}: `, ...info.map(m => chalk`{black.bgWhite ${m}}`))
}

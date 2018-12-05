const chalk = require('chalk')
const raven = require('raven')
raven.config(process.env.SENTRY_DSN, { parseUser: false })

module.exports = {
  startup: (info) => console.log(`${chalk.white.bgGreen('STARTUP')} ${info}`),
  fatal: (info) => {
    console.log(chalk`${new Date()} {bold.white.bgRed FATAL}: ${info}`)
    process.exit()
  },
  error: (info) => console.log(chalk`${new Date()} {bold.red ERROR}: ${info}`),
  warn: (info) => console.log(chalk`${new Date()} {bold.yellow WARN}: ${info}`),
  info: (info) => console.log(chalk`${new Date()} {bold.blue INFO}: {white ${info}}`)
}

const sa = require('superagent')

require('dotenv').config()
let globalHookErrors = 0

setInterval(() => {
  globalHookErrors-- // This timeout exists so that if the shard manager starts to spew errors, I don't get IP banned from Discord.
}, 5000)

function fatal (message) {
  if (globalHookErrors < 5) {
    sa
      .post(process.env.DISCORD_WEBHOOK_URL)
      .send({
        avatar_url: 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-bell-512.png',
        username: `Fatal Error LoggerBot Webhook Notification`,
        embeds: [{
          title: 'Fatal',
          description: message,
          color: 16777215
        }]
      })
      .end(err => {
        if (err) globalHookErrors = globalHookErrors + 1
      })
  }
}

function error (message) {
  if (globalHookErrors < 5) {
    sa
      .post(process.env.DISCORD_WEBHOOK_URL)
      .send({
        avatar_url: 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-bell-512.png',
        username: `Error LoggerBot Webhook Notification`,
        embeds: [{
          title: 'Error',
          description: message,
          color: 16711680
        }]
      })
      .end(err => {
        if (err) globalHookErrors = globalHookErrors + 1
      })
  }
}

function warn (message) {
  if (globalHookErrors < 5) {
    sa
      .post(process.env.DISCORD_WEBHOOK_URL)
      .send({
        avatar_url: 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-bell-512.png',
        username: `Warning LoggerBot Webhook Notification`,
        embeds: [{
          title: 'Warning',
          description: message,
          color: 15466375
        }]
      })
      .end(err => {
        if (err) globalHookErrors = globalHookErrors + 1
      })
  }
}

function generic (message) {
  if (globalHookErrors < 5) {
    sa
      .post(process.env.DISCORD_WEBHOOK_URL)
      .send({
        avatar_url: 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-bell-512.png',
        username: `Generic LoggerBot Webhook Notification`,
        embeds: [{
          title: 'Generic',
          description: message,
          color: 6052351
        }]
      })
      .end(err => {
        if (err) globalHookErrors = globalHookErrors + 1
      })
  }
}

function custom (message) {
  if (globalHookErrors < 5) {
    sa
      .post(process.env.DISCORD_WEBHOOK_URL)
      .send({
        avatar_url: message.avatar_url || 'https://cdn4.iconfinder.com/data/icons/ionicons/512/icon-ios7-bell-512.png',
        embeds: [{
          title: message.title || 'Custom Notification',
          color: message.color || 6052351,
          description: message.description || 'No message description provided.'
        }],
        timestamp: new Date()
      })
      .end(err => {
        if (err) globalHookErrors = globalHookErrors + 1
      })
  }
}

exports.error = error
exports.warn = warn
exports.generic = generic
exports.fatal = fatal
exports.custom = custom

if (!process.env.DISCORD_WEBHOOK_URL) {
  global.logger.warn('Discord webhook url not specified, disabling webhook notifier.')
  exports.error = () => { }
  exports.warn = () => { }
  exports.generic = () => { }
  exports.fatal = () => { }
}

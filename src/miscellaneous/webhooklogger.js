const sa = require('superagent')

require('dotenv').config() // to stop a race condition
let globalHookErrors = 0

setInterval(() => {
  globalHookErrors-- // This timeout exists so that if the shard manager starts to spew errors, I don't get IP banned from Discord.
}, 5000)

function fatal (message) {
  if (globalHookErrors < 5) {
    sa
      .post(process.env.DISCORD_WEBHOOK_URL)
      .send({
        avatar_url: 'https://cdn.discordapp.com/avatars/298822483060981760/c5f04275e99defe458fc7ebbef0d5e72.jpg?size=128',
        username: 'Logger Webhook Notification',
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
        avatar_url: 'https://cdn.discordapp.com/avatars/298822483060981760/c5f04275e99defe458fc7ebbef0d5e72.jpg?size=128',
        username: 'Logger Webhook Notification',
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
        avatar_url: 'https://cdn.discordapp.com/avatars/298822483060981760/c5f04275e99defe458fc7ebbef0d5e72.jpg?size=128',
        username: 'Logger Webhook Notification',
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
        avatar_url: 'https://cdn.discordapp.com/avatars/298822483060981760/c5f04275e99defe458fc7ebbef0d5e72.jpg?size=128',
        username: 'Logger Webhook Notification',
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
        avatar_url: message.avatar_url || 'https://cdn.discordapp.com/avatars/298822483060981760/c5f04275e99defe458fc7ebbef0d5e72.jpg?size=128',
        embeds: [{
          title: message.title || 'Logger Custom Notification',
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

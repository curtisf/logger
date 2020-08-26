const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./loggerbot.sqlite')

// do preparation
db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS webhooks ( channel_id TEXT PRIMARY KEY, webhook_id TEXT, webhook_token TEXT )')
  db.run('CREATE TABLE IF NOT EXISTS invites ( guild_id TEXT PRIMARY KEY, invites_array TEXT[] )')
  db.run('CREATE TABLE IF NOT EXISTS messages ( id TEXT PRIMARY KEY, author_id TEXT NOT NULL, content TEXT, attachment_b64 TEXT, ts TIMESTAMPTZ )')
  db.run('CREATE TABLE IF NOT EXISTS guilds ( id TEXT PRIMARY KEY, owner_id TEXT NOT NULL, ignored_channels TEXT[], disabled_events TEXT[], event_logs TEXT, log_bots BOOL )')
})

module.exports = db

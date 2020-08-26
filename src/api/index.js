const app = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const serverConfig = require('./serverconfig.js')
const getDoc = require('../db/interfaces/sqlite').getGuild
const setEventLogsFull = require('../db/interfaces/sqlite').setEventLogsWhole
const { DEFAULT_EVENT_MAP } = require('../bot/utils/constants')
const { setEventLogsWhole } = require('../db/interfaces/sqlite.js')

app()
  .set('view engine', 'pug')
  .set('views', path.resolve(__dirname, 'views'))
  .use(app.static(path.resolve(__dirname, 'static')))
  .use(bodyParser.urlencoded({ extended: true }))
  .get('/api/botinfo', (req, res) => {
    res.json({ ...global.bot.user, ...{ avatarURL: global.bot.user.dynamicAvatarURL('png', '64'), _client: undefined } }) // bots can't have animated avas
  })
  .get('/api/server/:id', async (req, res) => {
    if (!req.params.id) {
      res.status(400).end('Missing a server ID to get information about.')
    } else {
      try {
        const guildDoc = await getDoc(req.params.id)
        res.json(guildDoc.event_logs)
      } catch (e) {
        res.status(404).end('That server does not exist.')
      }
    }
  })
  .post('/api/savechannels', async (req, res) => {
    await setEventLogsWhole(req.body.guildID, { ...DEFAULT_EVENT_MAP, ...req.body.events })
    res.status(201).end()
  })
  .get('/', (req, res) => {
    res.render('selector', {
      guilds: global.bot.guilds.map(g => {
        return {
          name: g.name,
          iconURL: g.dynamicIconURL(null, '512'),
          id: g.id
        }
      })
    })
  })
  .get('/configure/:id', (req, res) => {
    if (!req.params.id) {
      res.render('error', { code: '400', message: 'That server doesn\'t exist!' })
    } else {
      serverConfig(req, res)
    }
  })
  .get('*', (req, res) => {
    res.render('error', { code: '404', message: 'Page not found.' })
  })
  .listen(8082, err => {
    if (err) throw err
    global.signale.success('API listening on port 8082')
  })

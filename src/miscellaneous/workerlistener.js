const cluster = require('cluster')
const webhookLogger = require('./webhooklogger')
const Zabbix = require('zabbix-promise')
const Eris = require('eris')
const requestEris = new Eris(`Bot ${process.env.BOT_TOKEN}`)

const workerCrashes = {}
let ratelimitCounter = 0
let restHits = 0
let ipcMessageCounter = 0
let auditLogHitCounter = 0
let statsObj = {}
let webhookSends = 0
let nonWebhookSends = 0
const activityByUrlMap = new Map()

requestEris.on('ratelimit-hit', () => ratelimitCounter++)
requestEris.on('rest-hit', () => restHits++)
requestEris.on('warn', w => {
  console.warn('Request Eris Warning', w)
})
requestEris.on('error', e => {
  console.error('Request Eris Error', e)
})

const allWorkers = []

if (process.env.STAT_SUBMISSION_INTERVAL && !isNaN(parseInt(process.env.STAT_SUBMISSION_INTERVAL))) {
  setInterval(async () => {
    allWorkers.forEach(w => {
      w.send(JSON.stringify({ type: 'sendStats' }))
    })
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve('ok')
      }, 2000)
    })
    if (ipcMessageCounter !== 0) {
      await Zabbix.sender({
        server: 'localhost',
        host: process.env.ZABBIX_HOST,
        key: 'logger.misc.ipc-counter',
        value: ipcMessageCounter
      })
      ipcMessageCounter = 0
    }
    if (ratelimitCounter !== 0) {
      await Zabbix.sender({
        server: 'localhost',
        host: process.env.ZABBIX_HOST,
        key: 'logger.event.ratelimit-hit',
        value: ratelimitCounter
      })
      ratelimitCounter = 0
    }
    if (restHits !== 0) {
      await Zabbix.sender({
        server: 'localhost',
        host: process.env.ZABBIX_HOST,
        key: 'logger.event.rest-hit',
        value: restHits
      })
      restHits = 0
    }
    if (auditLogHitCounter !== 0) {
      await Zabbix.sender({
        server: 'localhost',
        host: process.env.ZABBIX_HOST,
        key: 'logger.misc.fetchAuditLogs',
        value: auditLogHitCounter
      })
      auditLogHitCounter = 0
    }
    if (webhookSends !== 0) {
      await Zabbix.sender({
        server: 'localhost',
        host: process.env.ZABBIX_HOST,
        key: 'logger.event.webhookSends',
        value: webhookSends
      })
      webhookSends = 0
    }
    if (nonWebhookSends !== 0) {
      await Zabbix.sender({
        server: 'localhost',
        host: process.env.ZABBIX_HOST,
        key: 'logger.event.nonWebhookSends',
        value: nonWebhookSends
      })
      nonWebhookSends = 0
    }
    if (statsObj.commandUsage) {
      for (const eventName in statsObj.eventUsage) {
        if (statsObj?.eventUsage[eventName] > 0) {
          try {
            const result = await Zabbix.sender({
              server: 'localhost',
              host: process.env.ZABBIX_HOST,
              key: `logger.event.${eventName}`,
              value: statsObj.eventUsage[eventName] === 0 ? 1 : statsObj.eventUsage[eventName]
            })
          } catch (error) {
            global.logger.error(`event send error: ${eventName}`)
          }
        }
      }

      for (const commandName in statsObj.commandUsage) {
        if (statsObj?.commandUsage[commandName] > 0) {
          try {
            const result = await Zabbix.sender({
              server: 'localhost',
              host: process.env.ZABBIX_HOST,
              key: `logger.command.${commandName}`,
              value: statsObj.commandUsage[commandName] === 0 ? 1 : statsObj.commandUsage[commandName]
            })
          } catch (error) {
            global.logger.error(`command send error: ${commandName}`)
          }
        }
      }

      for (const miscName in statsObj.miscUsage) {
        if (statsObj?.miscUsage[miscName] > 0) {
          try {
            const result = await Zabbix.sender({
              server: 'localhost',
              host: process.env.ZABBIX_HOST,
              key: `logger.misc.${miscName}`,
              value: statsObj.miscUsage[miscName] === 0 ? 1 : statsObj.miscUsage[miscName]
            })
          } catch (error) {
            global.logger.error(`misc event send error: ${miscName}`)
          }
        }
      }

      statsObj = {}
    }
  }, parseInt(process.env.STAT_SUBMISSION_INTERVAL) + 250) // add 1/4 second deadband to allow the shards to respond
}

module.exports = async worker => {
  allWorkers.push(worker)
  worker.on('online', () => {
    global.logger.startup(`WORKER ${worker.id} started hosting ${worker.rangeForShard}`)
    worker.send({
      type: 'startup',
      processType: 'bot',
      rangeForShard: worker.rangeForShard,
      shardStart: worker.shardStart,
      shardEnd: worker.shardEnd,
      totalShards: worker.totalShards
    })

    if (process.uptime() > 50) {
      webhookLogger.custom({
        title: `Worker ${worker.id} started`,
        description: `Hosting ${worker.shardStart}`
      })
    }
  })

  worker.on('message', async message => {
    if (!message.type) return
    if (message.type === 'stats') {
      if (!statsObj.hasOwnProperty('commandUsage')) {
        statsObj = message
      } else {
        for (const commandName in message.commandUsage) {
          statsObj.commandUsage[commandName] += message.commandUsage[commandName]
        }
        for (const eventName in message.eventUsage) {
          statsObj.eventUsage[eventName] += message.eventUsage[eventName]
        }
        for (const miscItem in message.miscUsage) {
          statsObj.miscUsage[miscItem] += message.miscUsage[miscItem]
        }
      }
    } else if (message.type === 'apiRequest') {
      ipcMessageCounter++
      let response
      let error

      const { method, url, auth, body, file, _route, short } = message

      if (url.endsWith('audit-logs')) {
        auditLogHitCounter++
      }

      if (url.includes('webhooks')) {
        webhookSends++
      } else {
        nonWebhookSends++
      }

      if (activityByUrlMap.size > 100000) {
        console.log('URL activity map getting big, clearing...')
        activityByUrlMap.clear()
      }

      if (!activityByUrlMap.has(url)) {
        activityByUrlMap.set(url, 1)
      } else {
        activityByUrlMap.set(url, activityByUrlMap.get(url) + 1)
      }

      if (file && file.file) file.file = Buffer.from(file.file, 'base64')

      try {
        response = await requestEris.requestHandler.request(method, url, auth, body, file, _route, short)
      } catch (err) {
        error = {
          code: err.code,
          message: err.message,
          stack: err.stack
        }
      }

      if (error) {
        worker.send(JSON.stringify({ type: 'fetchReturn', id: `apiResponse.${message.requestID}`, err: error }))
      } else {
        worker.send(JSON.stringify({ type: 'fetchReturn', id: `apiResponse.${message.requestID}`, data: response }))
      }
    } else if (message.type === 'debugActivity') {
      if (message.data === 'clear') {
        console.log('clearing activity')
        activityByUrlMap.clear()
        console.log('OK cleared')
      } else {
        console.debug([...activityByUrlMap.entries()].sort((e1, e2) => e2[1] - e1[1]).slice(0, 200))
      }
    }
  })

  worker.on('disconnect', () => {
    console.error(`[${cluster.worker.rangeForShard}] IPC disconnected!`)
    global.webhook.error(`[${cluster.worker.rangeForShard}] IPC disconnected! <@&349414410869276673>`)
    process.exit(1)
  })

  worker.on('exit', code => {
    allWorkers.splice(allWorkers.indexOf(worker), 1)
    if (code === 0) {
      global.logger.info(`Worker ${worker.id} hosting ${worker.shardStart}-${worker.shardStart} successfully killed.`)
      global.webhook.generic(`Worker ${worker.id} hosting ${worker.shardStart}-${worker.shardStart} successfully killed.`)
    } else if (workerCrashes[worker.rangeForShard] >= 2) {
      global.logger.error(`Worker ${worker.id} hosting ${worker.rangeForShard} is will not be respawned due to a detected boot loop.`)
      global.webhook.fatal(`Worker ${worker.id} hosting ${worker.rangeForShard} is will not be respawned due to a detected boot loop. | ${worker.id}`)
    } else {
      global.logger.error(`Worker ${worker.id} died with code ${code}, hosting ${worker.rangeForShard}. Attempting to respawn a replacement.`)
      global.webhook.fatal(`Worker ${worker.id} died with code ${code}, hosting ${worker.rangeForShard}. Attempting to respawn a replacement.`)
      const nw = cluster.fork()
      Object.assign(nw, {
        type: 'startup',
        processType: 'bot',
        rangeForShard: worker.rangeForShard,
        shardStart: worker.shardStart,
        shardEnd: worker.shardEnd,
        totalShards: worker.totalShards
      })
      module.exports(nw) // assign listeners to recreated worker

      global.webhook.generic(`Respawned dead worker ${worker.id} hosting ${worker.rangeForShard} as ${nw.id}.`)
      if (workerCrashes[worker.rangeForShard]) workerCrashes[worker.rangeForShard]++
      else workerCrashes[worker.rangeForShard] = 1
      setTimeout(() => {
        if (workerCrashes[worker.rangeForShard] === 1) delete workerCrashes[worker.rangeForShard]
        else workerCrashes[worker.rangeForShard]--
      })
    }
  })
}

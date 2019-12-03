const cluster = require('cluster')
const webhookLogger = require('./webhooklogger')
const Zabbix = require('zabbix-promise')
const workerCrashes = {}
let statsObj = {}

if (process.env.STAT_SUBMISSION_INTERVAL && !isNaN(parseInt(process.env.STAT_SUBMISSION_INTERVAL))) {
  setInterval(async () => {
    if (statsObj.commandUsage) {
      for (const eventName in statsObj.eventUsage) {
        if (statsObj.eventUsage[eventName] > 0) {
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
        if (statsObj.commandUsage[commandName] > 0) {
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
        if (statsObj.miscUsage[miscName] > 0) {
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
  worker.on('online', () => {
    console.log(`WORKER ${worker.id} started hosting ${worker.rangeForShard}`)
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

  worker.on('message', message => {
    if (message.type && message.type === 'stats') {
      if (!statsObj.hasOwnProperty('commandUsage')) {
        statsObj = message
        return
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
    }
  })

  worker.on('exit', code => {
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

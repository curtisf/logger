const webhookLogger = require('./webhooklogger')
const workerCrashes = {}

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

  worker.on('exit', (code, signal) => {
    if (signal) return // if there's a signal, that means something killed the worker and as thus shouldn't be restarted.
    else if (code === 0) {
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
      if (!workerCrashes[worker.rangeForShard]) workerCrashes[worker.rangeForShard] = 1
      else workerCrashes[worker.rangeForShard]++
      setTimeout(() => {
        if (workerCrashes[worker.rangeForShard] === 1) delete workerCrashes[worker.rangeForShard]
        else workerCrashes[worker.rangeForShard]--
      })
    }
  })
}

const cluster = require('cluster')
const sa = require('superagent')
const addListeners = require('./src/miscellaneous/workerlistener')

require('dotenv').config()

const staggerLaunchQueue = []
let staggerInterval

async function init () {
  sa.get('https://discord.com/api/gateway/bot').set('Authorization', `Bot ${process.env.BOT_TOKEN}`).then(async b => {
    const totalShards = b.body.shards // get recommended shard count
    let shardsPerWorker
    if (process.env.USE_MAX_CONCURRENCY === 'true') { // eslint-disable-line eqeqeq
      if (b.body.session_start_limit.max_concurrency === 1) {
        global.logger.warn(`Use max concurrency was specified, but observed gateway concurrency is ${b.body.session_start_limit.max_concurrency}`)
      }
      if (b.body.shards % 16 !== 0) {
        global.logger.warn('Max concurrency mode is enabled and set on Discord, but the shard count is not a multiple of 16!')
      }
      global.logger.info(`Using max concurrency of ${b.body.session_start_limit.max_concurrency}. Cluster starting will be delayed!`) // shardsPerWorker is set to 16 below
    }
    const coreCount = require('os').cpus().length
    if (coreCount > totalShards) shardsPerWorker = 1
    else shardsPerWorker = process.env.USE_MAX_CONCURRENCY === 'true' ? 16 : Math.ceil(totalShards / coreCount) + 2 // eslint-disable-line eqeqeq
    // if max concurrency isn't enabled this will work
    const workerCount = Math.ceil(totalShards / shardsPerWorker) // if max concurrency is 16, shard count / 16 will be an integer for how many workers are needed
    global.webhook.generic(`Shard manager is booting up. Discord recommends ${totalShards} shards. With the core count being ${coreCount}, there will be ${shardsPerWorker} shards per worker, and ${workerCount} workers.${process.env.USE_MAX_CONCURRENCY === 'true' ? ' Max concurrency is enabled.' : ''}`) // eslint-disable-line eqeqeq
    global.logger.startup(`[SHARDER]: TOTAL SHARDS: ${totalShards}\nCore count: ${coreCount}\nShards per worker: ${shardsPerWorker}\nWorker count: ${workerCount}${process.env.USE_MAX_CONCURRENCY === 'true' ? '\nMax concurrency is enabled.' : ''}`)
    for (let i = 0; i < workerCount; i++) {
      const shardStart = i * shardsPerWorker
      let shardEnd = ((i + 1) * shardsPerWorker) - 1
      if (shardEnd > totalShards - 1) shardEnd = totalShards - 1
      let rangeForShard
      if (shardStart === shardEnd) {
        rangeForShard = `shard ${shardStart}`
      } else {
        rangeForShard = `shards ${shardStart}-${shardEnd}`
      }
      if (process.env.CUSTOM_CLUSTER_LAUNCH == 'true' && i === 0 && process.env.USE_MAX_CONCURRENCY !== 'true') { // eslint-disable-line eqeqeq
        global.logger.info(`Custom launch mode specified, use range: ${rangeForShard} (start ${shardStart} end ${shardEnd})`)
        global.webhook.generic(`Custom launch mode specified, use range: ${rangeForShard} (start ${shardStart} end ${shardEnd})`)
        continue
      }
      if (process.env.USE_MAX_CONCURRENCY === 'true') {
        staggerLaunch({ type: 'bot', shardStart, shardEnd, rangeForShard, totalShards })
        continue
      }
      const worker = cluster.fork()
      Object.assign(worker, { type: 'bot', shardStart, shardEnd, rangeForShard, totalShards })
      addListeners(worker)
    }
  }).catch(console.error)
}

function staggerLaunch (info) {
  // WARNING: 16x sharding won't work on default eris as of today, you will need a fork (mine works!)
  staggerLaunchQueue.push(info)
  if (!staggerInterval) {
    staggerInterval = setInterval(() => {
      const worker = cluster.fork()
      const workerInfo = staggerLaunchQueue.shift()
      if (workerInfo) {
        Object.assign(worker, workerInfo)
        addListeners(worker)
      } else {
        clearInterval(staggerInterval)
        staggerInterval = null // standard doesn't like me using delete so xd
      }
    }, parseInt(process.env.REDIS_LOCK_TTL) + 250)
  }
}

init()

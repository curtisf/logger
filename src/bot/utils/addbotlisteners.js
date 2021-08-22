const listenerIndexer = require('../../miscellaneous/listenerIndexer')
const eventMiddleware = require('../modules/eventmiddleware')
const cluster = require('cluster')

let webhookErrorCount = 0
let lastRetryAfter

module.exports = () => {
  const statAggregator = require('../modules/statAggregator')

  global.bot.on('global-ratelimit-hit', timeLeft => { // using global. instead of just passing the bot instance is lazy
    global.webhook.error(`${new Date().toISOString()} [${cluster.worker.rangeForShard}] global ratelimit hit, time remaining: ${timeLeft}`)
    console.warn(`${new Date().toISOString()} [${cluster.worker.rangeForShard}] global ratelimit hit, time remaining: ${timeLeft}`)
    statAggregator.incrementEvent('global-ratelimit-hit')
    global.redis.set('logger-global', timeLeft, 'EX', timeLeft)
  })

  global.bot.on('ratelimit-hit', info => {
    statAggregator.incrementEvent('ratelimit-hit')
    console.warn(`${new Date().toISOString()} [${cluster.worker.rangeForShard}] ratelimit hit, is ${!info.global && 'not '}global`, info.info)
  })

  global.bot.on('webhook-ratelimit-hit', d => {
    webhookErrorCount++
    lastRetryAfter = d.retryAfter
    if (webhookErrorCount % 50 === 0) {
      console.warn(`${new Date().toISOString()} [${cluster.worker.rangeForShard}] webhook ratelimit error mod 50 hit`, lastRetryAfter, webhookErrorCount)
    }
    statAggregator.incrementEvent('webhook-ratelimit-hit')
  })

  const [on, once] = listenerIndexer()

  on.forEach(async event => eventMiddleware(event, 'on'))
  once.forEach(async event => eventMiddleware(event, 'once'))
}

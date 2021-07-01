const listenerIndexer = require('../../miscellaneous/listenerIndexer')
const eventMiddleware = require('../modules/eventmiddleware')
const cluster = require('cluster')

module.exports = () => {
  const statAggregator = require('../modules/statAggregator')

  global.bot.on('global-ratelimit-hit', timeLeft => { // using global. instead of just passing the bot instance is lazy
    global.webhook.error(`[${cluster.worker.rangeForShard}] global ratelimit hit, time remaining: ${timeLeft}`)
    console.warn(`[${cluster.worker.rangeForShard}] global ratelimit hit, time remaining: ${timeLeft}`)
    statAggregator.incrementEvent('global-ratelimit-hit')
    global.redis.set('logger-global', timeLeft + 20, 'EX', timeLeft + 20)
  })

  const [on, once] = listenerIndexer()

  on.forEach(async event => eventMiddleware(event, 'on'))
  once.forEach(async event => eventMiddleware(event, 'once'))
}

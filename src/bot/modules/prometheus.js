const { register, collectDefaultMetrics, Histogram, Counter } = require('prom-client')

register.setDefaultLabels({
  app: 'loggerbot',
  cluster: cluster.worker.rangeForShard, // assigned at start
})

collectDefaultMetrics({
  timeout: 10000,
  register
})

const postgresQueryExecution = new Histogram({
  name: 'postgres_query_execution',
  help: 'Duration of Postgres queries in seconds',
  labelNames: ['context'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.250, 0.5, 1, 5, 10] // 0.05 to 10 seconds
})

const eventExecutionHistogram = new Histogram({
  name: 'event_execution_duration_seconds',
  help: 'Duration of event executions in seconds',
  labelNames: ['event_name'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.250, 0.5, 1, 5, 10] // 0.05 to 10 seconds
})

const logSendCounter = new Counter({
  name: 'log_send_counter',
  help: 'Total number of logs sent',
  labelNames: ['event_name']
})

register.registerMetric(eventExecutionHistogram)

async function getBotMetricsArray() {
  const botMetrics = await register.getMetricsAsJSON()
  return botMetrics
}

exports.getBotMetricsArray = getBotMetricsArray
exports.logSendCounter = logSendCounter
exports.postgresQueryExecution = postgresQueryExecution
exports.eventExecutionHistogram = eventExecutionHistogram
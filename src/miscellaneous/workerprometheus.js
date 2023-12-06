const { register, collectDefaultMetrics, Histogram, Counter } = require("prom-client");


exports.collectWorkerMetrics = function () {
  register.setDefaultLabels({
    app: 'loggerbot',
    cluster: cluster.worker.rangeForShard
  })
  collectDefaultMetrics({
    timeout: 10000,
    labels: {
      cluster: cluster.worker.rangeForShard
    },
    register
  })
}

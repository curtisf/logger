const cluster = require('cluster')
const path = require('path')

async function assignWorkerInfo (info) {
  if (info.type !== 'startup') {
    cluster.worker.once('message', assignWorkerInfo)
    return
  }

  if (info.processType === 'bot') {
    Object.assign(cluster.worker, info)
    require(path.resolve('src', 'bot', 'index'))
  }
}

cluster.worker.once('message', assignWorkerInfo)

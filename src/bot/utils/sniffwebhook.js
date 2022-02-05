module.exports = webhookID => { // use to find bad shared webhooks
  return new Promise((resolve, reject) => {
    const stream = global.redis.scanStream({
      match: 'webhook-*',
      count: 100
    })
    stream.on('data', resultKeys => {
      stream.pause()
      global.redis.mget(resultKeys).then(bigMGETValues => {
        if (bigMGETValues.find(v => v.startsWith(webhookID))) {
          const owningKey = resultKeys[bigMGETValues.indexOf(bigMGETValues.find(v => v.startsWith(webhookID)))]
          resolve(owningKey)
        } else {
          stream.resume()
        }
      }).catch(e => reject(e))
    })
    stream.on('end', () => {
      console.log('All data has been visited')
      resolve()
    })
  })
}

module.exports = {
  name: 'error',
  type: 'on',
  handle: (err, id) => {
    global.logger.error(`Shard ${id} encountered an error!`)
    console.error(err)
  }
}

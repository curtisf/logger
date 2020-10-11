module.exports = {
  name: 'warn',
  type: 'on',
  handle: w => {
    global.logger.warn(`[ERIS] - ${w}`)
  }
}

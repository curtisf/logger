module.exports = {
  name: 'warn',
  type: 'on',
  handle: w => {
    if (w.includes('Invalid session')) return
    global.logger.warn(`[ERIS] - ${w}`)
  }
}

module.exports = {
  name: 'warn',
  type: 'on',
  handle: w => {
    if (typeof w === 'string') {
      if (w?.includes('Invalid session')) return
    }
    global.signale.warn(`[ERIS] - ${w}`)
  }
}

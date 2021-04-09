module.exports = {
  name: 'error',
  type: 'on',
  handle: e => {
    console.error('[ERIS] ERROR: ', e)
  }
}

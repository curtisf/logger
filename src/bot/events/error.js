module.exports = {
  name: 'error',
  type: 'on',
  handle: (err, id) => {
    console.error(err)
  }
}

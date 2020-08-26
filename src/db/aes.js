require('dotenv').config()

const AES = require('aes256')
const cipher = AES.createCipher(global.envInfo.AES_KEY)

module.exports = cipher

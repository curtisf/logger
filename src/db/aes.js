require('dotenv').config()

const AES = require('aes256')
const cipher = AES.createCipher(process.env.AES_KEY)

module.exports = cipher

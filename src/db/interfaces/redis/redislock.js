const redisClient = require('../../clients/redis')
const Redlock = require('redlock')

const redlock = new Redlock([redisClient], {
		driftFactor: 0.01, // time in ms
		retryCount:  10,
		retryDelay:  200, // time in ms
		retryJitter:  200 // time in ms
	}
)

module.exports = redlock
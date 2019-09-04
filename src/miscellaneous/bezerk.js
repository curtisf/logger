/* This file interacts with the websocket management system bezerk.
 * Since shards are spawned separately from eachother (processes), they need to communicate
 * From https://github.com/thesharks/wildbeast
 */

const uri = process.env.BEZERK_URI
const secret = process.env.BEZERK_SECRET
const WS = require('ws')
const cacheGuild = require('../bot/utils/cacheGuild')

let socket

function start () {
  global.logger.info(`Bezerk connection started to ${uri}`)
  socket = new WS(uri)
  socket.on('error', e => {
    global.logger.error(`Bezerk socket error, ${e.message}`)
  })
  socket.on('close', () => {
    global.logger.warn('Bezerk socket got destroyed, reconnecting...')
    setTimeout(start, 500)
  })
  socket.on('message', m => {
    let msg
    try {
      msg = JSON.parse(m)
    } catch (e) {
      return global.logger.error('Failed to decrypt Bezerk payload, ' + e.message)
    }
    switch (msg.op) {
      case '1001': { // IDENTIFY
        return send({
          op: '1003', // IDENTIFY_SUPPLY
          c: {
            secret: secret,
            shard: cluster.worker.rangeForShard
          }
        })
      }
      case '1002': { // IDENTIFY_REPLY
        if (msg.c.success === true) {
          global.logger.info(`Bezerk connection fully open.`)
          global.logger.info('Successfully connected to Bezerk.')
        } else {
          global.logger.warn('Bezerk rejected authentication! Not reconnecting.')
        }
        break
      }
      case '2001': { // REQUEST
        const bot = global.bot
        try {
          if (msg.c.startsWith('recache')) {
            msg.c = msg.c.replace('recache ', '')
            cacheGuild(msg.c)
          } else {
          const resp = eval(msg.c) // TODO: replace eval with more OP codes for each use
          send({
            op: '2002', // REQUEST_REPLY
            c: resp,
            uuid: msg.uuid
          })
        }
        } catch (e) {
          send({
            op: '5000', // CANNOT_COMPLY
            c: e.message,
            uuid: msg.uuid ? msg.uuid : 6334
          })
        }
      }
    }
  })
}

function send (payload) {
  if (typeof payload === 'object') payload = JSON.stringify(payload)
  socket.send(payload)
}

if (uri && secret) start()

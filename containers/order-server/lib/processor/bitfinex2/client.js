const WebSocket = require('ws')

const { EventEmitter } = require('events')

const getenv = require('getenv')

const {
  merge
} = require('ramda')

const { hmacFrom } = require('./crypto')

const {
  convert,
  recover
} = require('./helpers')

/**
 * Constants
 */ /**
 * Ready state constants
 */

const STATE_DICT = {
  'CONNECTING' : 0,
  'OPEN'       : 1,
  'CLOSING'    : 2,
  'CLOSED'     : 3
}

const WSS_URL = 'wss://api.bitfinex.com/ws/2'

const CREDENTIALS = getenv.multi({
  apiKey    : ['BITFINEX2_API_KEY'],
  apiSecret : ['BITFINEX2_API_SECRET']
})

/**
 *  WS methods
 */

/**
 * Bitfinex specific `auth` object
 *
 * @param {WebSocket} ws
 * @param {Object} [creds]
 * @param {string} [creds.apiKey]
 * @param {string} [creds.apiSecret]
 *
 * @returns {Object}
 */

async function authenticate (client, creds = CREDENTIALS) {
  const { ws } = client

  const { apiKey, apiSecret } = creds

  const authNonce = Date.now() * 1e3
  const authPayload = `AUTH${authNonce}`
  const authSig = hmacFrom(apiSecret, authPayload)

  const payload =  {
    event: 'auth',
    apiKey,
    authNonce,
    authPayload,
    authSig
  }

  const cb = (resolve, reject) => {
    client.once('origin:auth', (res) => {
      if (!res.error) return resolve(ws)

      client.close()
      reject(new Error(error))
    })

    client.send(payload)
  }

  return new Promise(cb)
}

/**
 *
 */

class Client extends EventEmitter {
  constructor () {
    super()

    this.orders = {}
  }

  get isOpen () {
    return this.ws.readyState === STATE_DICT['OPEN']
  }

  open () {
    const ws = new WebSocket(WSS_URL)

    this.ws = ws

    ws.on('message', msg => {
      const payload = JSON.parse(msg)

      if (payload.event) {
        const { event } = payload
        return this.emit(`origin:${event}`, payload)
      }

      if (!Array.isArray(payload)) {
        return void 0
      }

      const [channelId, event, arr] = payload

      if (event === 'hb') {
        this.hb = Date.now()
      }

      if (event === 'oc') {
        const order = recover(arr)

        this.emit(`origin:oc`, order)
        this.emit(`origin:oc:${order.cid}`, order)
      }

      if (event === 'n') {
        const ts = arr[0]
        const type = arr[6]
        const info = arr[7]

        const payload = arr[4]

        const cid = Array.isArray(payload) && payload[2]

        if (cid && type === 'ERROR') {
          const res = {
            cid,
            ts,
            info,
            status: 'rejected'
          }

          this.emit(`origin:err:${cid}`, res)
        }
      }

    })

    return new Promise((resolve, reject) => {
      ws.once('open', _ => {
        this.hb = Date.now()
        resolve(ws)
      })
    })
  }

  send (payload) {
    const msg = JSON.stringify(payload)
    this.ws.send(msg)
  }

  re (data) {
    const { cid } = data
    const initial = this.orders[cid]

    if (!initial) return void 0

    delete this.orders[cid]

    return merge(initial, data)
  }

  async authenticate (creds = CREDENTIALS) {
    return authenticate(this, creds)
  }

  async placeOrder (data) {
    const orderPayload = convert(data)

    const { cid } = orderPayload

    this.orders[cid] = data

    return new Promise((resolve, reject) => {
      this.once(`origin:oc:${cid}`, payload => {
        const res = this.re(payload)
        resolve(res)
      })

      this.once(`origin:err:${cid}`, payload => {
        const res = this.re(payload)

        reject(res)
      })

      this.send([ 0, 'on', null, orderPayload ])
    })
  }

  close () {
    this.ws.close()
  }
}

module.exports = Client

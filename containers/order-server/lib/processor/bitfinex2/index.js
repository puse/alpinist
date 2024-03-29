const debug = require('debug')('alpinist:orders:bitfinex2')

const { Observable } = require('rxjs/Rx')

const {
  merge,
  tap,
  identity
} = require('ramda')

const createPool = require('./pool')

const {
  convert,
  recover
} = require('./helpers')

/**
 *
 */

const pool = createPool()

/**
 *
 */

function Connect (creds = {}) {
  let clientP = pool.acquire()

  const toOrder = params => {
    const submitP = clientP
      .then(client => client.placeOrder(params))
      .catch(identity)

    return Observable
      .fromPromise(submitP)
  }

  return order =>
    Observable
      .of(order)
      .map(tap(o => debug('Received order: %O', o)))
      .flatMap(toOrder)
      .map(tap(o => debug('Processed order: %O', o)))
}

module.exports = Connect

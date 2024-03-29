const { Observable } = require('rxjs/Rx')

const { isNotNil } = require('ramda-adjunct')

const { fetchAll } = require('./actions')

/**
 * Defaul settings
 */

const DEFAULT_DELAY = 7500

const DEFAULT_SYMBOLS = require('./symbols.json')

/**
 * Observable constructor
 *
 * @param {Object} opts
 * @param {number} opts.delay
 * @param {Array}  opts.currencies
 */

function Monitor (opts = {}) {
  const {
    delay = DEFAULT_DELAY,
    symbols = DEFAULT_SYMBOLS
  } = opts

  const exec = _ => fetchAll(symbols)

  const poll = _ =>
    Observable
      .fromPromise(exec())
      .filter(isNotNil)
      .flatMap(Observable.from)

  return Observable
    .timer(0, delay)
    .flatMap(poll)
}

module.exports = Monitor

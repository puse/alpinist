const debug = require('debug')('alpinist:tickers:cexio')

const Axios = require('axios')

const { recover } = require('./helpers')

const {
  compose,
  prop,
  map
} = require('ramda')

/**
 * Settings
 */

const baseURL = 'https://cex.io/api/tickers'

/**
 * Setup
 */

const request = Axios.create({ baseURL })

/**
 * Helpers
 */

const report = err => {
  debug('Error %s', err.message)
}

const allFromRaw = compose(
  map(recover),
  prop('data')
)

/**
 * Actions
 */

function fetchAll (currencies = []) {
  // `/USD/EUR/...`
  const xPath = '/' + currencies.join('/')

  return request(xPath)
    .then(res => res.data)
    .then(allFromRaw)
    .catch(report)
}

/**
 * Expose
 */

module.exports = {
  fetchAll
}

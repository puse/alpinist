import test from 'ava'

import Queue from '../lib/queue'

const queue = new Queue()

const BUY_ORDER = {
  broker   : 'mock',
  symbol   : 'ethusd',
  side     : 'buy',
  price    : 500,
  quantity : 0.2
}

const SELL_ORDER = {
  broker   : 'mock',
  symbol   : 'ethusd',
  side     : 'sell',
  price    : 500,
  quantity : 0.2
}

test('constructor', async t => {
  t.is(typeof Queue, 'function')
})

test('add', async t => {
  const order = await queue.add(BUY_ORDER)

  // console.log(order)

  t.is(1, 1)
})

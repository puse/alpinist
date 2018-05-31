const {
  Observable,
  Subject
} = require('rxjs/Rx')

const {
  Order
} = require('bitfinex-api-node/lib/models')

const {
  assoc,
  compose
} = require('ramda')

const {
  renameKeys
} = require('ramda-adjunct')

function fromOrder (order) {
  const subject = new Subject()

  const open = compose(
    x => subject.next(x),
    assoc('status', 'open'),
    Order.unserialize
  )

  const close = compose(
    _ => subject.complete(),
    x => subject.next(x),
    renameKeys({ 'priceAvg': 'price' }),
    assoc('status', 'closed'),
    Order.unserialize
  )

  const reject = compose(
    err => subject.error(err)
  )

  order.on('close', close)

  return Observable.create(observer => {
    subject
      .subscribe(observer)

    order.registerListeners()

    order
      .submit()
      .then(open)
      .catch(reject)

    return () => {
      order.removeListeners()
    }
  })
}

module.exports = {
  fromOrder
}
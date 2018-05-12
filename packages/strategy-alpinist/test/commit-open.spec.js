import test from 'ava'

import commitFill from '../lib/commit-fill'

const commit = commitFill({
  level_threshold: 5,
  weight_initial: 100,
  weight_up_b: 10,
  weight_up_k: 2,
  weight_down_b: 15,
  weight_down_k: 1.75
})

test('empty', t => {
  const [ slot ] = commit(100, [])

  t.is(slot.price, 100)
  t.is(slot.volume, 1)
})

test('some', t => {
  const oldSlots = [
    { price: 100, volume: 1 }
  ]

  const [ upA, upB ] = commit(105, oldSlots)

  t.is(upB.price, 105)
  t.is(upB.volume, 2)

  const [ downA, downB ] = commit(95, oldSlots)

  t.is(downA.price, 95)
  t.is(downA.volume, 2)
})

test('none', t => {
  const oldSlots = [
    { price: 100, volume: 1 }
  ]

  const [ xA, xB ] = commit(104, oldSlots)

  t.is(xB, undefined)
})
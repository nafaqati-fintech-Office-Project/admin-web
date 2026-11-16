import assert from 'node:assert/strict'
import { test } from 'node:test'
import { maskEmail, sanitize, setViolationHandler, shortId, suppressSmall } from '../src/lib/privacy.js'

test('sanitize drops personal and financial keys at any depth', () => {
  setViolationHandler(() => {})
  const out = sanitize({
    id: 'u1', email: 'a@b.com', plan: 'PREMIUM',
    nested: [{ amount: 5, status: 'OK', merchant: 'X', Phone: '1' }],
  })
  assert.deepEqual(out, { id: 'u1', plan: 'PREMIUM', nested: [{ status: 'OK' }] })
})

test('sanitize reports what it dropped', () => {
  let seen = []
  setViolationHandler((k) => { seen = k })
  sanitize({ balance: 1, ok: 2 })
  assert.deepEqual(seen, ['balance'])
})

test('maskEmail hides the identity', () => {
  assert.equal(maskEmail('john.doe@gmail.com'), 'j***@g***.com')
  assert.equal(maskEmail('nope'), '—')
})

test('shortId and suppressSmall', () => {
  assert.equal(shortId('1234567890abcdef'), '12345678')
  assert.equal(suppressSmall(3), '<5')
  assert.equal(suppressSmall(0), '0')
  assert.equal(suppressSmall(40), '40')
})

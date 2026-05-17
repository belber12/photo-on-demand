'use strict'
const chat = require('../chat')

test('chat module loads', () => {
  expect(chat).toBeDefined()
})

test('validateLead returns null for null input', () => {
  expect(chat.validateLead(null)).toBeNull()
})

test('validateLead accepts valid RU phone and name', () => {
  const result = chat.validateLead({
    name: 'Олег',
    phone: '+79991234567',
    shoot_type: 'Портрет',
    plan: 'Про',
    reply_text: 'Записала!'
  })
  expect(result).not.toBeNull()
  expect(result.name).toBe('Олег')
  expect(result.phone).toBe('+79991234567')
})

test('validateLead rejects name shorter than 2 chars', () => {
  expect(chat.validateLead({ name: 'А', phone: '+79991234567' })).toBeNull()
  expect(chat.validateLead({ name: '', phone: '+79991234567' })).toBeNull()
})

test('validateLead rejects invalid phone formats', () => {
  expect(chat.validateLead({ name: 'Олег', phone: '12345' })).toBeNull()
  expect(chat.validateLead({ name: 'Олег', phone: '+14155552671' })).toBeNull()
  expect(chat.validateLead({ name: 'Олег', phone: '' })).toBeNull()
})

test('validateLead normalizes 8-prefix phone to +7', () => {
  const result = chat.validateLead({ name: 'Олег', phone: '89991234567' })
  expect(result).not.toBeNull()
  expect(result.phone).toBe('+79991234567')
})

test('processMessage throws without ANTHROPIC_API_KEY', async () => {
  const orig = process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  await expect(chat.processMessage({ messages: [{ role: 'user', content: 'hi' }] }))
    .rejects.toThrow(/ANTHROPIC_API_KEY/)
  process.env.ANTHROPIC_API_KEY = orig
})

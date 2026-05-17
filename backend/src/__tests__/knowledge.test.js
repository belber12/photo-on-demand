'use strict'
const knowledge = require('../knowledge')

test('module loads', () => {
  expect(knowledge).toBeDefined()
})

test('SHOOT_TYPES is array of strings', () => {
  expect(Array.isArray(knowledge.SHOOT_TYPES)).toBe(true)
  expect(knowledge.SHOOT_TYPES.length).toBeGreaterThan(0)
  expect(typeof knowledge.SHOOT_TYPES[0]).toBe('string')
})

test('ALLOWED_PLANS contains three tiers', () => {
  expect(knowledge.ALLOWED_PLANS).toEqual(['Базовый', 'Про', 'Энтерпрайз'])
})

test('PLANS has price for each tier', () => {
  expect(knowledge.PLANS).toBeDefined()
  expect(knowledge.PLANS['Базовый'].price).toBe(7900)
  expect(knowledge.PLANS['Про'].price).toBe(14900)
  expect(knowledge.PLANS['Энтерпрайз'].price).toBe(29900)
})

test('buildSystemPrompt returns a string mentioning Анна', () => {
  const prompt = knowledge.buildSystemPrompt()
  expect(typeof prompt).toBe('string')
  expect(prompt).toMatch(/Анна/)
})

test('buildSystemPrompt uses override when provided', () => {
  const custom = 'Custom prompt text'
  expect(knowledge.buildSystemPrompt(custom)).toBe(custom)
  expect(knowledge.buildSystemPrompt('')).toMatch(/Анна/)
  expect(knowledge.buildSystemPrompt(null)).toMatch(/Анна/)
})

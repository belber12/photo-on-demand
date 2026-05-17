'use strict'

const Anthropic = require('@anthropic-ai/sdk')
const { OpenAI } = require('openai')
const { buildSystemPrompt, SHOOT_TYPES, ALLOWED_PLANS } = require('./knowledge')

const PHONE_RE = /^\+?[78]\d{10}$/

function normalizePhone(raw) {
  const digits = raw.replace(/[\s\-().]/g, '')
  return digits.startsWith('8') ? '+7' + digits.slice(1) : digits
}

function validateLead(input) {
  if (!input || typeof input !== 'object') return null
  const name = typeof input.name === 'string' ? input.name.trim().slice(0, 100) : ''
  if (name.length < 2) return null
  const rawPhone = typeof input.phone === 'string' ? input.phone.replace(/[\s\-().]/g, '') : ''
  if (!PHONE_RE.test(rawPhone)) return null
  const email = typeof input.email === 'string' && input.email.includes('@') ? input.email.trim().slice(0, 200) : null
  return {
    name,
    phone: normalizePhone(rawPhone),
    email,
    shoot_type: SHOOT_TYPES.includes(input.shoot_type) ? input.shoot_type : null,
    plan: ALLOWED_PLANS.includes(input.plan) ? input.plan : null,
  }
}

const CAPTURE_LEAD_TOOL_ANTHROPIC = {
  name: 'capture_lead',
  description: 'Зафиксировать контакт клиента когда получены имя и телефон',
  input_schema: {
    type: 'object',
    properties: {
      name:       { type: 'string' },
      phone:      { type: 'string' },
      shoot_type: { type: 'string', enum: SHOOT_TYPES },
      plan:       { type: 'string', enum: ALLOWED_PLANS },
      reply_text: { type: 'string', description: 'Текст ответа клиенту' },
    },
    required: ['name', 'phone', 'reply_text'],
  },
}

const CAPTURE_LEAD_TOOL_OPENAI = {
  type: 'function',
  function: {
    name: 'capture_lead',
    description: 'Зафиксировать контакт клиента когда получены имя и телефон',
    parameters: {
      type: 'object',
      properties: {
        name:       { type: 'string' },
        phone:      { type: 'string' },
        email:      { type: 'string', description: 'Email клиента если назвал' },
        shoot_type: { type: 'string', enum: SHOOT_TYPES },
        plan:       { type: 'string', enum: ALLOWED_PLANS },
        reply_text: { type: 'string', description: 'Текст ответа клиенту' },
      },
      required: ['name', 'phone', 'reply_text'],
    },
  },
}

function toOpenAIMessages(systemPrompt, messages) {
  const result = [{ role: 'system', content: systemPrompt }]
  for (const m of messages) {
    const content = Array.isArray(m.content)
      ? m.content.filter(b => b.type === 'text').map(b => b.text).join('')
      : String(m.content || '')
    result.push({ role: m.role, content })
  }
  return result
}

async function processWithOpenRouter({ apiKey, baseURL, model, maxTokens, systemPrompt, messages, signal }) {
  const client = new OpenAI({
    apiKey,
    baseURL,
  })

  const response = await client.chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: toOpenAIMessages(systemPrompt, messages),
    tools: [CAPTURE_LEAD_TOOL_OPENAI],
    tool_choice: 'auto',
  }, { signal })

  const msg = response.choices[0].message
  let reply = msg.content || ''
  let lead = null

  if (msg.tool_calls && msg.tool_calls.length > 0) {
    const tc = msg.tool_calls.find(t => t.function.name === 'capture_lead')
    if (tc) {
      const args = JSON.parse(tc.function.arguments)
      lead = validateLead(args)
      if (lead && args.reply_text) reply = args.reply_text
    }
  }

  return { reply: reply.trim(), lead }
}

async function processWithAnthropic({ apiKey, baseURL, model, maxTokens, systemPrompt, messages, signal }) {
  const client = new Anthropic({ apiKey, ...(baseURL ? { baseURL } : {}) })

  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages,
    tools: [CAPTURE_LEAD_TOOL_ANTHROPIC],
    tool_choice: { type: 'auto' },
  }, { signal })

  let reply = ''
  let lead = null

  for (const block of response.content) {
    if (block.type === 'text') {
      reply += block.text
    } else if (block.type === 'tool_use' && block.name === 'capture_lead') {
      lead = validateLead(block.input)
      if (lead && block.input.reply_text) reply = block.input.reply_text
    }
  }

  return { reply: reply.trim(), lead }
}

async function processMessage({ messages, channel = 'web', sessionId, systemPromptOverride }) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const baseURL = process.env.ANTHROPIC_BASE_URL || ''
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
  const maxTokens = parseInt(process.env.CHAT_MAX_TOKENS || '600', 10)
  const systemPrompt = buildSystemPrompt(systemPromptOverride)
  const isOpenRouter = baseURL.includes('openrouter')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  let result
  try {
    result = isOpenRouter
      ? await processWithOpenRouter({ apiKey, baseURL, model, maxTokens, systemPrompt, messages, signal: controller.signal })
      : await processWithAnthropic({ apiKey, baseURL: baseURL || undefined, model, maxTokens, systemPrompt, messages, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }

  return { ...result, session_id: sessionId }
}

module.exports = { validateLead, processMessage }

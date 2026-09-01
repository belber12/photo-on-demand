'use strict'

// AI-консультант фотостудии «Фото на заказ».
// Вместо прямого вызова Claude/OpenRouter делегируем сообщение
// Hermes-агенту «Анна» (профиль anna на Mac Mini) по протоколу A2A.

const { SHOOT_TYPES, ALLOWED_PLANS } = require('./knowledge')

const PHONE_RE = /^\+?[1-9]\d{6,14}$/
// LEAD-маркер — отдельная последняя строка ответа агента.
const LEAD_MARKER_RE = /(?:^|\n)LEAD:\s*(\{.*\})\s*$/s

function normalizePhone(raw) {
  const digits = raw.replace(/[\s\-().]/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  return digits.startsWith('+') ? digits : '+' + digits
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

// Извлекает LEAD-маркер из ответа агента. Возвращает { reply, lead }.
function extractLead(text) {
  const src = typeof text === 'string' ? text : ''
  const m = src.match(LEAD_MARKER_RE)
  if (!m) return { reply: src.trim(), lead: null }

  let lead = null
  try {
    lead = validateLead(JSON.parse(m[1]))
  } catch {
    lead = null
  }

  const reply = src.slice(0, m.index).trim()
  return { reply: reply || src.trim(), lead }
}

function makeMessageId() {
  return globalThis.crypto && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function sendToHermes({ a2aUrl, a2aToken, lastUserText, sessionId, signal }) {
  const res = await fetch(a2aUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${a2aToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: makeMessageId(),
      method: 'SendMessage',
      params: {
        message: {
          messageId: makeMessageId(),
          role: 'user',
          contextId: sessionId || undefined,
          parts: [{ text: lastUserText, mediaType: 'text/plain' }],
        },
      },
    }),
    signal,
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = new Error(`Hermes A2A HTTP ${res.status}${body ? ': ' + body.slice(0, 200) : ''}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

function extractReplyText(raw) {
  const task = raw && raw.result && raw.result.task
  if (!task) return ''

  const parts = (task.status && task.status.message && task.status.message.parts) || []
  let text = parts.map((p) => (p && p.text) || '').join('')

  if (!text && Array.isArray(task.artifacts)) {
    for (const a of task.artifacts) {
      text = ((a && a.parts) || []).map((p) => (p && p.text) || '').join('')
      if (text) break
    }
  }
  return text
}

async function processMessage({ messages, channel = 'web', sessionId, systemPromptOverride }) {
  const a2aUrl = (process.env.HERMES_A2A_URL || '').trim()
  const a2aToken = (process.env.HERMES_A2A_TOKEN || '').trim()
  if (!a2aUrl || !a2aToken) throw new Error('HERMES_A2A_URL / HERMES_A2A_TOKEN not configured')

  const lastUser = [...messages].reverse().find((m) => m && m.role === 'user')
  if (!lastUser || typeof lastUser.content !== 'string') throw new Error('no user message')
  const lastUserText = lastUser.content.trim()
  if (!lastUserText) throw new Error('empty user message')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)

  let raw
  try {
    raw = await sendToHermes({ a2aUrl, a2aToken, lastUserText, sessionId, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('AI response timeout')
      e.name = 'AbortError'
      throw e
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }

  const replyText = extractReplyText(raw)
  if (!replyText) throw new Error('empty Hermes A2A reply')

  const { reply, lead } = extractLead(replyText)
  return { reply, lead, session_id: sessionId }
}

module.exports = { validateLead, processMessage }

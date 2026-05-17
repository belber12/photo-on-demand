'use strict'

const INJECTION_PATTERNS = [
  /ignore\s+previous/i,
  /system\s+prompt/i,
  /repeat\s+(your\s+)?instructions/i,
  /SELECT\s+\*/i,
  /DROP\s+TABLE/i,
]

const OUTPUT_LEAK_PATTERNS = [
  /sk-ant-[A-Za-z0-9\-_]+/g,
  /VITE_[A-Z_]+=\S+/g,
  /service_role[^\s]*/g,
]

const MAX_MESSAGES = 30
const MAX_MSG_LENGTH = 4000

function hasInjection(text) {
  if (typeof text !== 'string') return false
  return INJECTION_PATTERNS.some(re => re.test(text))
}

function sanitizeOutput(text) {
  if (typeof text !== 'string') return text
  let out = text
  for (const re of OUTPUT_LEAK_PATTERNS) {
    out = out.replace(re, '[FILTERED]')
  }
  return out
}

function validateMessages(messages) {
  if (!Array.isArray(messages)) return { ok: false, error: 'messages must be array' }
  if (messages.length === 0) return { ok: false, error: 'messages array is empty' }
  if (messages.length > MAX_MESSAGES) return { ok: false, error: `max ${MAX_MESSAGES} messages` }
  const ALLOWED_ROLES = new Set(['user', 'assistant'])
  for (const msg of messages) {
    if (!ALLOWED_ROLES.has(msg.role)) return { ok: false, error: `invalid role: ${msg.role}` }
    if (typeof msg.content !== 'string') return { ok: false, error: 'content must be string' }
    if (msg.content.length > MAX_MSG_LENGTH) return { ok: false, error: 'message too long' }
  }
  return { ok: true }
}

// In-memory rate limit fallback: 10 req/min per IP sliding window
const inMemoryStore = new Map()

function inMemoryRateLimit(ip) {
  const now = Date.now()
  const window = 60_000
  const limit = 10
  const record = inMemoryStore.get(ip) || { count: 0, resetAt: now + window }
  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + window
  }
  record.count++
  inMemoryStore.set(ip, record)
  return record.count <= limit
}

let redisRateLimiter = null

async function tryInitRedis() {
  const url = process.env.UPSTASH_REDIS_URL
  const token = process.env.UPSTASH_REDIS_TOKEN
  if (!url || !token) return false
  try {
    const { Redis } = require('@upstash/redis')
    const { Ratelimit } = require('@upstash/ratelimit')
    const redis = new Redis({ url, token })
    redisRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'chat_rl',
    })
    return true
  } catch {
    return false
  }
}

tryInitRedis().catch(() => {})

function createRateLimiter() {
  return async function rateLimitMiddleware(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown'
    try {
      if (redisRateLimiter) {
        const { success } = await redisRateLimiter.limit(ip)
        if (!success) return res.status(429).json({ error: 'Too many requests' })
      } else {
        if (!inMemoryRateLimit(ip)) return res.status(429).json({ error: 'Too many requests' })
      }
    } catch {
      if (!inMemoryRateLimit(ip)) return res.status(429).json({ error: 'Too many requests' })
    }
    next()
  }
}

module.exports = { hasInjection, sanitizeOutput, validateMessages, createRateLimiter }

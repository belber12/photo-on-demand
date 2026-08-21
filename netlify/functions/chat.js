// Netlify Function: прокси чата на Hermes (профиль anna, API Server)
// Фронтенд ожидает: { reply: string, lead?: { name, phone, ... } | null }
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) }
  }
  try {
    const body = JSON.parse(event.body || '{}')
    const messages = Array.isArray(body.messages) ? body.messages : []
    const upstream = (process.env.ANNA_API_URL || '').replace(/\/+$/, '')
    const apiKey = process.env.ANNA_API_KEY || ''

    if (!upstream || !apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'ANNA_API_URL / ANNA_API_KEY not set' }) }
    }

    const res = await fetch(`${upstream}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'anna',
        messages: messages.slice(-12), // последние 12 сообщений — контекст
        max_tokens: 400,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return { statusCode: 502, body: JSON.stringify({ error: `Upstream ${res.status}: ${errText.slice(0, 200)}` }) }
    }

    const data = await res.json()
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''

    // Простой парсинг лида: если Анна написала имя и телефон — фиксируем
    let lead = null
    const phoneMatch = reply.match(/\+?7\s?[-\s(]?\d{3}[-\s)]?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}|8\s?[-\s(]?\d{3}[-\s)]?\s?\d{3}[-\s]?\d{2}[-\s]?\d{2}/)
    if (phoneMatch) {
      lead = { name: null, phone: phoneMatch[0].replace(/[^\d+]/g, ''), source: 'web' }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ reply, lead }),
    }
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e.message || e) }) }
  }
}

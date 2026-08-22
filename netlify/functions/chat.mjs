// Netlify Function (ESM): прокси чата на Hermes (профиль anna, API Server)
export const handler = async (event) => {
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
        messages: messages.slice(-8),
        max_tokens: 220,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      return { statusCode: 502, body: JSON.stringify({ error: `Upstream ${res.status}: ${errText.slice(0, 200)}` }) }
    }

    const data = await res.json()
    const reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''

    // Парсинг лида: телефон — из сообщения клиента (полный), имя — из ответа Анны или сообщения клиента
    let lead = null
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    const clientText = lastUserMsg ? String(lastUserMsg.content || '') : ''
    const phoneMatch = clientText.match(/\+7[\s\d-]{9,14}|8[\s\d-]{10,14}/)
    if (phoneMatch) {
      const nameFromReply = reply.match(/Записала вас,\s*([А-ЯЁ][а-яё-]+)/)
      const nameFromClient = clientText.match(/(?:зовут|меня зовут|я)\s+([А-ЯЁ][а-яё-]+)/i)
      const name = (nameFromReply && nameFromReply[1]) || (nameFromClient && nameFromClient[1]) || null
      lead = {
        name,
        phone: phoneMatch[0].replace(/[^\d+]/g, '').replace(/^8/, '+7'),
        source: 'web',
      }
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

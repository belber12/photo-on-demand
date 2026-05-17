const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787'

export async function sendMessage({ messages, channel = 'web', sessionId }) {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, channel, session_id: sessionId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { status: res.status })
  }
  return res.json()
}

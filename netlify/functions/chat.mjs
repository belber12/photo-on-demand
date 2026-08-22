export const handler = async (event) => {
  const body = JSON.parse(event.body || '{}')
  const messages = Array.isArray(body.messages) ? body.messages : []
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
  const clientText = lastUserMsg ? String(lastUserMsg.content || '') : ''
  const phoneMatch = clientText.match(/\+7[\s\d-]{9,14}|8[\s\d-]{10,14}/)
  const phone = phoneMatch ? phoneMatch[0].replace(/[^\d+]/g, '').replace(/^8/, '+7') : null
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientText, phone, lead: phone ? { name: 'Мария', phone, source: 'web' } : null }),
  }
}

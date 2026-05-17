import { useState, useCallback, useRef } from 'react'
import { useChatStorage } from './useChatStorage'
import { sendMessage } from '../lib/chat-api'
import { isValidLead } from '../lib/chat-protocol'
import { supabase } from '../lib/supabase'

const WELCOME = 'Привет! Я Анна, консультант фотостудии «Фото на заказ». Чем могу помочь?'

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 4) + '***' + phone.slice(-4)
}

export function useChat() {
  const { sessionId, messages, setMessages, leadSent, setLeadSent } = useChatStorage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showRating, setShowRating] = useState(false)
  const leadSentRef = useRef(leadSent)
  const allMessagesRef = useRef(messages)
  leadSentRef.current = leadSent

  const initialMessages = messages.length === 0
    ? [{ role: 'assistant', content: WELCOME }]
    : messages

  const send = useCallback(async (userText) => {
    if (!userText.trim()) return

    const userMsg = { role: 'user', content: userText.trim() }
    const nextMessages = [...(messages.length === 0 ? [] : messages), userMsg]

    setMessages((prev) => {
      const base = prev.length === 0 ? [{ role: 'assistant', content: WELCOME }] : prev
      const updated = [...base, userMsg]
      allMessagesRef.current = updated
      return updated
    })
    setLoading(true)
    setError(null)

    try {
      const apiMessages = nextMessages.filter((m) => m.role !== 'system')
      const result = await sendMessage({ messages: apiMessages, sessionId })

      // Human-like typing delay: longer reply = more "thinking" time
      const typingDelay = Math.max(1800, Math.min(result.reply.length * 25, 4500))
      await new Promise(r => setTimeout(r, typingDelay))

      const assistantMsg = { role: 'assistant', content: result.reply }
      setMessages((prev) => {
        const updated = [...prev, assistantMsg]
        allMessagesRef.current = updated
        return updated
      })

      if (result.lead && isValidLead(result.lead) && !leadSentRef.current) {
        const leadId = await captureLead(result.lead, sessionId)
        await saveSession(allMessagesRef.current, leadId, result.lead)
        setLeadSent(true)
        setMessages((prev) => [
          ...prev,
          { role: 'system', content: '✓ Менеджер свяжется с вами в течение часа' },
        ])
        // Farewell from Anna after a short pause
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Рада была помочь! Если возникнут вопросы — пишите, всегда на связи. Хорошего дня!' },
          ])
          setTimeout(() => setShowRating(true), 1200)
        }, 2000)
      }
    } catch (err) {
      setError(err.status === 429
        ? 'Слишком много запросов. Подождите минуту.'
        : 'Ошибка связи. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
    }
  }, [messages, sessionId, setMessages, setLeadSent])

  return { messages: initialMessages, send, loading, error, showRating }
}

async function captureLead(lead, sessionId) {
  const key = await computeHash(`${sessionId}:${lead.phone}:${lead.shoot_type}`)
  const row = {
    name: lead.name,
    phone: lead.phone,
    shoot_type: lead.shoot_type,
    plan: lead.plan,
    source: 'chat_widget',
    dedupe_key: key,
  }
  if (lead.email) row.email = lead.email
  const { data, error } = await supabase.from('leads').insert(row).select('id').single()
  if (error && error.code !== '23505') {
    console.warn('[chat] lead insert failed:', error.message)
    return null
  }
  return data?.id ?? null
}

async function saveSession(messages, leadId, lead) {
  // Mask phone in stored transcript
  const safeMessages = messages.map((m) => ({
    ...m,
    content: lead?.phone ? m.content.replace(lead.phone, maskPhone(lead.phone)) : m.content,
  }))
  const { error } = await supabase.from('chat_sessions').insert({
    messages: safeMessages,
    lead_id: leadId,
    converted: !!leadId,
    channel: 'web',
  })
  if (error) console.warn('[chat] session insert failed:', error.message)
}

async function computeHash(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

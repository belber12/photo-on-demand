import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'pod_chat_v1'
const MAX_STORED = 50

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function useChatStorage() {
  const [sessionId] = useState(() => {
    const stored = loadStored()
    return stored?.sessionId || crypto.randomUUID()
  })

  const [messages, setMessages] = useState(() => {
    const stored = loadStored()
    if (!stored?.sessionId) return []
    return Array.isArray(stored.messages) ? stored.messages : []
  })

  const [leadSent, setLeadSent] = useState(() => {
    const stored = loadStored()
    if (!stored?.sessionId) return false
    return stored.leadSent === true
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId,
      messages: messages.slice(-MAX_STORED),
      leadSent,
    }))
  }, [sessionId, messages, leadSent])

  const clearHistory = useCallback(() => {
    setMessages([])
    setLeadSent(false)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { sessionId, messages, setMessages, leadSent, setLeadSent, clearHistory }
}

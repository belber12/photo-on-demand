import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence } from 'framer-motion'
import { ChatButton } from './ChatButton'
import { ChatPanel } from './ChatPanel'
import { useChat } from '../../hooks/useChat'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const { messages, send, loading, error, showRating } = useChat()

  const hasUnread = !open && messages.length > 0

  function handleRate(stars) {
    // Save rating to localStorage; close chat after 3s
    try { localStorage.setItem('pod_anna_rating', stars) } catch {}
    setTimeout(() => setOpen(false), 3000)
  }

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <ChatPanel
            messages={messages}
            loading={loading}
            error={error}
            onSend={send}
            onClose={() => setOpen(false)}
            showRating={showRating}
            onRate={handleRate}
          />
        )}
      </AnimatePresence>
      <ChatButton onClick={() => setOpen((v) => !v)} unread={hasUnread} />
    </div>,
    document.body
  )
}

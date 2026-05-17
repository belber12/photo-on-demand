import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'
import { QuickReplies } from './QuickReplies'
import { PromptInputBox } from '../ui/ai-prompt-box'
import { RatingWidget } from './RatingWidget'

export function ChatPanel({ messages, loading, error, onSend, onClose, showRating, onRate }) {
  const listRef = useRef(null)
  const showQuickReplies = messages.filter((m) => m.role === 'user').length === 0

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, loading])

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-[360px] h-[560px] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
      style={{ background: 'var(--bg-primary, #08080f)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5 shrink-0">
        <div className="relative">
          <img src="/anna-avatar.jpg" alt="Анна" className="w-9 h-9 rounded-full object-cover" />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#08080f]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold leading-tight">Анна</p>
          <p className="text-green-400 text-xs">онлайн</p>
        </div>
        <button onClick={onClose} aria-label="Закрыть чат" className="text-gray-400 hover:text-white transition-colors p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1 scroll-smooth">
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        {loading && <TypingIndicator />}
      </div>

      {/* Quick replies */}
      {showQuickReplies && <QuickReplies onSelect={onSend} />}

      {/* Error */}
      {error && (
        <div className="px-4 pb-2">
          <p className="text-xs text-red-400 text-center">{error}</p>
        </div>
      )}

      {/* Rating or Input */}
      {showRating ? (
        <RatingWidget onRate={onRate} />
      ) : (
        <div className="border-t border-white/10 shrink-0">
          <PromptInputBox onSend={onSend} placeholder="Напишите вопрос..." disabled={loading} />
        </div>
      )}
    </motion.div>
  )
}

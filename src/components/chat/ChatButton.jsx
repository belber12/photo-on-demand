import { motion } from 'framer-motion'

export function ChatButton({ onClick, unread }) {
  return (
    <div className="relative">
      {/* Pulse ring */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ff4fd8] to-[#22d3ee] opacity-40"
        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <button
        onClick={onClick}
        aria-label="Открыть чат с консультантом"
        className="relative w-14 h-14 rounded-full bg-gradient-to-r from-[#ff4fd8] to-[#22d3ee] flex items-center justify-center shadow-lg shadow-[#ff4fd8]/30 hover:scale-105 active:scale-95 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">1</span>
        )}
      </button>
    </div>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STARS = [1, 2, 3, 4, 5]

export function RatingWidget({ onRate }) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)
  const [done, setDone] = useState(false)

  function handleRate(val) {
    if (done) return
    setSelected(val)
    setDone(true)
    onRate(val)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-4 border-t border-white/10 bg-white/[0.03] text-center shrink-0"
    >
      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key="rating" exit={{ opacity: 0 }}>
            <p className="text-gray-400 text-xs mb-3">Как вам работа Анны?</p>
            <div className="flex justify-center gap-2">
              {STARS.map((s) => (
                <button
                  key={s}
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => handleRate(s)}
                  className="transition-transform hover:scale-110 active:scale-95"
                  aria-label={`${s} звезд`}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={(hovered || selected) >= s ? '#f59e0b' : 'none'}
                      stroke={(hovered || selected) >= s ? '#f59e0b' : '#4b5563'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.p
            key="thanks"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gray-400 text-xs py-1"
          >
            Спасибо за оценку. До встречи!
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

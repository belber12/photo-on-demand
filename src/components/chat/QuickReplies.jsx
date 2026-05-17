const QUICK = ['Сколько стоит портрет?', 'Хочу семейную фотосессию', 'Нужна бизнес-съёмка', 'Что входит в Про?']

export function QuickReplies({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {QUICK.map((text) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-gray-300 hover:border-[#ff4fd8]/60 hover:text-white transition-colors bg-white/5"
        >
          {text}
        </button>
      ))}
    </div>
  )
}

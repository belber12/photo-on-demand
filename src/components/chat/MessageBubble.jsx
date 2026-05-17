export function MessageBubble({ message }) {
  const { role, content } = message

  if (role === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
          {content}
        </span>
      </div>
    )
  }

  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-r from-[#ff4fd8] to-[#22d3ee] text-white rounded-br-sm'
            : 'bg-white/5 text-gray-200 rounded-bl-sm border border-white/10'
        }`}
      >
        {/* Plain text only — never dangerouslySetInnerHTML */}
        {content}
      </div>
    </div>
  )
}

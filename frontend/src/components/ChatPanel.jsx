import { useState } from 'react'
import { motion } from 'framer-motion'

export default function ChatPanel({ onSend, messages, loading, statusText }) {
  const [message, setMessage] = useState('How can I improve today?')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!message.trim()) return
    await onSend(message)
    setMessage('')
  }

  return (
    <motion.div
      className="glass-panel rounded-[28px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      whileHover={{ y: -4 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">AI coach</p>
          <h3 className="text-2xl font-semibold text-white">Your personal strategy loop</h3>
        </div>
        <div className="rounded-full border border-fuchsia-300/35 bg-fuchsia-500/12 px-3 py-1 text-xs text-fuchsia-200">
          Context aware
        </div>
      </div>

      <div className="mb-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {messages.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            className={`rounded-2xl p-3 text-sm leading-6 ${item.role === 'user' ? 'ml-auto max-w-[80%] bg-cyan-400/15 text-cyan-200' : 'mr-auto max-w-[90%] bg-white/5 text-slate-200'}`}
          >
            {item.text}
          </div>
        ))}
        {(loading || statusText) ? <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-3 text-sm text-fuchsia-100">{statusText || 'Analyzing pattern graph and risk vectors...'}</div> : null}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="flex-1 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none focus:border-aurora-500"
          placeholder="Ask about focus, sleep, or screen time"
        />
        <button className="rounded-2xl bg-gradient-to-r from-cyan-300 to-fuchsia-300 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]">
          Send
        </button>
      </form>
    </motion.div>
  )
}

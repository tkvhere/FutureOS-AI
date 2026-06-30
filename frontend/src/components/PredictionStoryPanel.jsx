import { motion } from 'framer-motion'

export default function PredictionStoryPanel({ story, whatIf }) {
  return (
    <motion.div
      className="glass-panel rounded-[28px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ y: -4 }}
    >
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Prediction story</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">Narrative projection</h3>
      <p className="mt-4 rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-4 text-base leading-7 text-slate-100">
        {story}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">30 Days</p>
          <p className="mt-1 text-xl font-semibold text-cyan-300">{whatIf.in30}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">90 Days</p>
          <p className="mt-1 text-xl font-semibold text-fuchsia-300">{whatIf.in90}%</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Burnout Risk</p>
          <p className="mt-1 text-xl font-semibold text-amber-300">{whatIf.burnoutRisk}%</p>
        </div>
      </div>
    </motion.div>
  )
}

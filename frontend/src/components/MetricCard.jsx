import { motion } from 'framer-motion'

export default function MetricCard({ label, value, hint, accent = 'aurora' }) {
  const accentMap = {
    aurora: 'from-cyan-400/30 to-transparent text-cyan-300',
    ember: 'from-fuchsia-400/30 to-transparent text-fuchsia-300',
    gold: 'from-gold-500/30 to-transparent text-gold-300',
  }

  return (
    <motion.div className="glass-panel h-full rounded-3xl p-5 shadow-glow" whileHover={{ y: -4, scale: 1.01 }} transition={{ duration: 0.2 }}>
      <div className={`mb-4 h-12 rounded-2xl bg-gradient-to-br ${accentMap[accent]}`} />
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <div className="mt-2 text-3xl font-semibold text-white">{value}</div>
      <p className="mt-2 text-sm text-slate-300">{hint}</p>
    </motion.div>
  )
}

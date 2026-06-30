import { motion } from 'framer-motion'

export default function SystemStatusPanel({ forecastMethod, latency = 'Live' }) {
  const items = [
    ['SYSTEM STATUS', 'ACTIVE'],
    ['AI MODEL', 'RUNNING'],
    ['SIMULATION ENGINE', 'STABLE'],
    ['FORECAST CORE', (forecastMethod || 'trend').toUpperCase()],
    ['SYNC LATENCY', latency.toUpperCase()],
  ]

  return (
    <motion.div
      className="glass-panel rounded-[28px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, delay: 0.08 }}
      whileHover={{ y: -4 }}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">System telemetry</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">Core status</h3>

      <div className="mt-4 space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
            <span className="text-xs tracking-[0.18em] text-slate-400">{label}</span>
            <span className="text-sm font-semibold text-cyan-300">{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

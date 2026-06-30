import { motion } from 'framer-motion'

function buildHeatmap(entries = [], liveScore = null) {
  const cells = []
  for (let week = 0; week < 4; week += 1) {
    for (let day = 0; day < 7; day += 1) {
      const idx = (week * 7) + day
      const score = entries.length
        ? Number(entries?.[idx]?.score || 0)
        : Number((liveScore?.productivity || 0) * (0.78 + (day * 0.02)) || 0)
      const intensity = Math.max(0.08, Math.min(1, score / 100))
      cells.push({
        id: `${week}-${day}`,
        intensity,
      })
    }
  }
  return cells
}

export default function ProductivityHeatmapPanel({ entries = [], liveScore = null }) {
  const heatmapCells = buildHeatmap(entries, liveScore)

  return (
    <motion.div
      className="glass-panel rounded-[28px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      whileHover={{ y: -4 }}
    >
      <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Productivity heatmap</p>
      <h3 className="mt-2 text-2xl font-semibold text-white">Rhythm intensity</h3>
      {!entries.length && liveScore ? (
        <p className="mt-2 text-sm text-slate-400">Live preview from current input</p>
      ) : null}

      <div className="mt-4 grid grid-cols-7 gap-2">
        {heatmapCells.map((cell, index) => (
          <motion.div
            key={cell.id}
            className="h-8 rounded-lg border border-white/10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.01 }}
            style={{
              background: `linear-gradient(135deg, rgba(34,211,238,${cell.intensity}), rgba(168,85,247,${Math.max(0.08, cell.intensity - 0.15)}))`,
            }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Low signal</span>
        <span>High signal</span>
      </div>
    </motion.div>
  )
}

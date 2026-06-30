import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { motion } from 'framer-motion'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function ComparisonChart({ current, ideal }) {
  const labels = ['Knowledge', 'Productivity', 'Energy', 'Discipline']

  return (
    <motion.div className="glass-panel rounded-[28px] p-6 shadow-glow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.06 }} whileHover={{ y: -4 }}>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">You vs ideal you</p>
        <h3 className="text-2xl font-semibold text-white">Outcome lift</h3>
      </div>
      <div className="h-72">
        <Bar
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1200, easing: 'easeOutQuart' },
            plugins: {
              legend: { labels: { color: '#dbeafe' } },
            },
            scales: {
              x: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.12)' },
              },
              y: {
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(148, 163, 184, 0.12)' },
              },
            },
          }}
          data={{
            labels,
            datasets: [
              {
                label: 'Current',
                data: current,
                backgroundColor: 'rgba(147, 51, 234, 0.72)',
                borderRadius: 14,
              },
              {
                label: 'Ideal',
                data: ideal,
                backgroundColor: 'rgba(34, 211, 238, 0.78)',
                borderRadius: 14,
              },
            ],
          }}
        />
      </div>

      <div className="mt-5 space-y-3">
        {labels.map((label, index) => {
          const currentValue = Number(current?.[index] || 0)
          const idealValue = Number(ideal?.[index] || 0)
          const progress = idealValue > 0 ? Math.min(100, Math.round((currentValue / idealValue) * 100)) : 0
          return (
            <div key={label}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                <span>{label}</span>
                <span>{progress}% of ideal</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

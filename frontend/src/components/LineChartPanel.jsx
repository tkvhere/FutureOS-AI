import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { motion } from 'framer-motion'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1100,
    easing: 'easeOutQuart',
  },
  plugins: {
    legend: {
      labels: {
        color: '#dbeafe',
      },
    },
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
}

export default function LineChartPanel({ title, subtitle, labels, datasets }) {
  return (
    <motion.div className="glass-panel rounded-[28px] p-6 shadow-glow" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} whileHover={{ y: -4 }}>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{subtitle}</p>
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
      </div>
      <div className="h-72">
        <Line
          options={baseOptions}
          data={{
            labels,
            datasets,
          }}
        />
      </div>
    </motion.div>
  )
}

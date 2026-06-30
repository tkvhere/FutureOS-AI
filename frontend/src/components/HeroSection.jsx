import { motion } from 'framer-motion'

export default function HeroSection({ user, score, goalMode }) {
  return (
    <motion.section
      className="glass-panel rounded-[30px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-cyan-200">Hero Section</p>
          <h2 className="mt-2 font-title text-4xl font-semibold text-white">Welcome back, {user?.name || 'Commander'}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Your life simulation cockpit is live. Continue your daily inputs, review your twin trajectory, and execute the next optimal action.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-2xl border border-cyan-300/25 bg-cyan-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Goal Mode</p>
            <p className="mt-2 text-xl font-semibold text-white">{goalMode}</p>
          </div>
          <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-100">System Score</p>
            <p className="mt-2 text-xl font-semibold text-white">{score}</p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

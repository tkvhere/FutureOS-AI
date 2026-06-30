import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { GOAL_PROFILES } from '../services/realtimeEngine'

const goalOptions = [
  { key: 'exam', label: 'Crack exam' },
  { key: 'job', label: 'Get job' },
  { key: 'focus', label: 'Improve focus' },
]

export default function GoalMissionPanel({ goal, onGoalChange, gamification }) {
  const completedCount = gamification.missions.filter((mission) => mission.completed).length
  const [showConfetti, setShowConfetti] = useState(false)
  const previousCount = useRef(completedCount)

  useEffect(() => {
    if (completedCount > previousCount.current) {
      setShowConfetti(true)
      const timer = window.setTimeout(() => setShowConfetti(false), 900)
      previousCount.current = completedCount
      return () => window.clearTimeout(timer)
    }
    previousCount.current = completedCount
    return undefined
  }, [completedCount])

  return (
    <motion.div
      className="glass-panel relative overflow-hidden rounded-[28px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      whileHover={{ y: -4 }}
    >
      {showConfetti ? (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 20 }, (_, index) => (
            <span
              key={index}
              className="mission-confetti"
              style={{
                left: `${8 + (index * 4.2) % 86}%`,
                animationDelay: `${(index % 6) * 0.04}s`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Goal mode</p>
        <h3 className="text-2xl font-semibold text-white">Mission control</h3>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {goalOptions.map((option) => (
          <button
            key={option.key}
            onClick={() => onGoalChange(option.key)}
            className={`rounded-xl border px-3 py-2 text-sm transition ${goal === option.key ? 'border-fuchsia-300/50 bg-fuchsia-400/15 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-slate-300">Priority target: {GOAL_PROFILES[goal]?.focusTarget}</p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
          <span>XP {gamification.xp}</span>
          <span>{gamification.level}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-300" style={{ width: `${gamification.progress}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {gamification.missions.map((mission) => (
          <div key={mission.label} className="rounded-xl border border-white/10 bg-slate-950/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-200">{mission.label}</span>
              <span className={`text-xs ${mission.completed ? 'text-emerald-300' : 'text-amber-300'}`}>
                {mission.completed ? `+${mission.reward} XP secured` : `+${mission.reward} XP pending`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

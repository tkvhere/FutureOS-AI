import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const initialForm = {
  study_hours: '4',
  sleep_hours: '7.5',
  screen_time_hours: '2',
  exercise_minutes: '30',
  mood: 'focused',
}

export default function HabitForm({ onSubmit, loading, onLiveChange, externalMood = '', liveScores, improvementDelta, whatIfProjection, tasks = [], targetStudyHours = 0, goalModelQuality = null }) {
  const [form, setForm] = useState(initialForm)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const simulationPhases = ['Running simulation...', 'Optimizing future...', 'Calculating outcomes...']

  const toNumericPayload = (currentForm) => ({
    study_hours: Number(currentForm.study_hours || 0),
    sleep_hours: Number(currentForm.sleep_hours || 0),
    screen_time_hours: Number(currentForm.screen_time_hours || 0),
    exercise_minutes: Number(currentForm.exercise_minutes || 0),
    mood: currentForm.mood,
  })

  useEffect(() => {
    onLiveChange?.(toNumericPayload(form))
  }, [form, onLiveChange])

  useEffect(() => {
    if (!loading) {
      setPhaseIndex(0)
      return undefined
    }
    const interval = window.setInterval(() => {
      setPhaseIndex((current) => (current + 1) % simulationPhases.length)
    }, 800)
    return () => window.clearInterval(interval)
  }, [loading])

  useEffect(() => {
    if (!externalMood) return
    setForm((current) => {
      if (current.mood === externalMood) {
        return current
      }
      return {
        ...current,
        mood: externalMood,
      }
    })
  }, [externalMood])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const normalizeInput = (name) => {
    if (name === 'mood') return
    setForm((current) => {
      const raw = current[name]
      if (raw === '') return current
      const numeric = Number(raw)
      if (Number.isNaN(numeric)) return current
      return {
        ...current,
        [name]: String(numeric),
      }
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(toNumericPayload(form))
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="glass-panel rounded-[28px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -4 }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Daily input</p>
          <h2 className="text-2xl font-semibold text-white">Habit tracker</h2>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full border border-aurora-500/30 bg-aurora-500/10 px-3 py-1 text-xs text-aurora-500">
            Live scoring
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
            Accuracy {goalModelQuality?.available ? `${goalModelQuality.within_15_days}%` : 'N/A'}
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Productivity</p>
          <p className="mt-1 text-xl font-semibold text-cyan-300">{liveScores.productivity}</p>
        </div>
        <div className="rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Knowledge</p>
          <p className="mt-1 text-xl font-semibold text-fuchsia-300">{liveScores.knowledge}</p>
        </div>
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-2">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Live feedback</p>
          <p className={`mt-1 text-xl font-semibold ${improvementDelta >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
            {improvementDelta >= 0 ? '+' : ''}{improvementDelta}%
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-300">Study hours</span>
          <input name="study_hours" type="number" step="0.25" inputMode="decimal" placeholder="e.g. 4.5" value={form.study_hours} onChange={handleChange} onBlur={() => normalizeInput('study_hours')} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-aurora-500" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-300">Sleep hours</span>
          <input name="sleep_hours" type="number" step="0.25" inputMode="decimal" placeholder="e.g. 7.5" value={form.sleep_hours} onChange={handleChange} onBlur={() => normalizeInput('sleep_hours')} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-aurora-500" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-300">Screen time</span>
          <input name="screen_time_hours" type="number" step="0.25" inputMode="decimal" placeholder="e.g. 2" value={form.screen_time_hours} onChange={handleChange} onBlur={() => normalizeInput('screen_time_hours')} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-aurora-500" />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-300">Exercise minutes</span>
          <input name="exercise_minutes" type="number" step="5" inputMode="numeric" placeholder="e.g. 30" value={form.exercise_minutes} onChange={handleChange} onBlur={() => normalizeInput('exercise_minutes')} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-aurora-500" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm text-slate-300">Mood tag</span>
          <select name="mood" value={form.mood} onChange={handleChange} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none transition focus:border-aurora-500">
            <option value="steady">Steady</option>
            <option value="focused">Focused</option>
            <option value="low energy">Low energy</option>
            <option value="stressed">Stressed</option>
            <option value="tired">Tired</option>
            <option value="unstable">Unstable</option>
          </select>
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">What-if simulator</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-400">30d projection</p>
            <p className="text-lg font-semibold text-cyan-300">{whatIfProjection.in30}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">90d projection</p>
            <p className="text-lg font-semibold text-fuchsia-300">{whatIfProjection.in90}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Burnout risk</p>
            <p className="text-lg font-semibold text-amber-300">{whatIfProjection.burnoutRisk}%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Today's plan</p>
        {targetStudyHours > 0 ? (
          <p className="mt-2 text-xs text-slate-400">
            Target study hours: <span className="text-white">{targetStudyHours}</span>
          </p>
        ) : null}
        {tasks.length ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {tasks.map((task) => (
              <li key={task} className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2">
                {task}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">Select a goal to generate today's tasks.</p>
        )}
      </div>

      {loading ? (
        <div className="mt-4 rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-2 text-sm text-fuchsia-100">
          {simulationPhases[phaseIndex]}
        </div>
      ) : null}

      <button disabled={loading} className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:scale-[1.01] hover:shadow-[0_12px_30px_rgba(217,70,239,0.35)] disabled:opacity-60">
        {loading ? 'Simulating...' : 'Save daily log'}
      </button>
    </motion.form>
  )
}

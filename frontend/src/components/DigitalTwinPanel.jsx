import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

const GOAL_VISUALS = {
  exam: {
    title: 'Exam mode',
    accent: 'from-cyan-300 via-sky-400 to-fuchsia-400',
    ring: 'rgba(34,211,238,0.95)',
    ringTrack: 'rgba(34,211,238,0.12)',
    shell: 'linear-gradient(135deg, rgba(14,165,233,0.28), rgba(168,85,247,0.16) 48%, rgba(34,211,238,0.22))',
  },
  job: {
    title: 'Career mode',
    accent: 'from-violet-300 via-fuchsia-400 to-cyan-300',
    ring: 'rgba(192,132,252,0.95)',
    ringTrack: 'rgba(192,132,252,0.12)',
    shell: 'linear-gradient(135deg, rgba(168,85,247,0.24), rgba(14,165,233,0.14) 52%, rgba(34,211,238,0.18))',
  },
  focus: {
    title: 'Focus mode',
    accent: 'from-emerald-300 via-cyan-300 to-sky-400',
    ring: 'rgba(52,211,153,0.95)',
    ringTrack: 'rgba(52,211,153,0.12)',
    shell: 'linear-gradient(135deg, rgba(16,185,129,0.24), rgba(34,211,238,0.12) 50%, rgba(14,165,233,0.18))',
  },
}

export default function DigitalTwinPanel({ twinState, scores, history = [], goalMode = 'focus' }) {
  const [liveScores, setScores] = useState({
    productivity: Number(scores?.productivity || 0),
    knowledge: Number(scores?.knowledge || 0),
    discipline: Number(scores?.discipline || 0),
  })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setScores({
      productivity: Number(scores?.productivity || 0),
      knowledge: Number(scores?.knowledge || 0),
      discipline: Number(scores?.discipline || 0),
    })
  }, [scores?.productivity, scores?.knowledge, scores?.discipline])

  const productivity = liveScores.productivity
  const averageScore = Math.round((liveScores.productivity + liveScores.knowledge + liveScores.discipline) / 3)
  const goalVisual = GOAL_VISUALS[goalMode] || GOAL_VISUALS.focus

  const avatar = useMemo(() => {
    if (productivity > 70) {
      return {
        status: 'Optimized',
        message: '🚀 Your twin is performing optimally',
        ring: 'rgba(34,211,238,0.95)',
        track: 'rgba(34,211,238,0.16)',
        aura: 'radial-gradient(circle, rgba(34,211,238,0.42) 0%, rgba(14,165,233,0.08) 46%, rgba(0,0,0,0) 76%)',
        orb: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.75), rgba(34,211,238,0.72) 28%, rgba(14,165,233,0.24) 58%, rgba(8,11,22,0.06) 100%)',
        shadow: '0 0 32px rgba(34,211,238,0.52), 0 0 84px rgba(14,165,233,0.3), inset 0 0 26px rgba(255,255,255,0.16)',
        pulseDuration: 1.8,
        floatDuration: 2.8,
        ringDuration: 8,
        glowScale: 1.08,
        badge: 'border-cyan-300/35 bg-cyan-500/10 text-cyan-100',
        accent: 'from-cyan-300 via-sky-300 to-fuchsia-300',
      }
    }

    if (productivity >= 40) {
      return {
        status: 'Stable',
        message: 'Stable but needs improvement',
        ring: 'rgba(168,85,247,0.9)',
        track: 'rgba(168,85,247,0.14)',
        aura: 'radial-gradient(circle, rgba(168,85,247,0.34) 0%, rgba(99,102,241,0.1) 44%, rgba(0,0,0,0) 74%)',
        orb: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.72), rgba(168,85,247,0.66) 28%, rgba(99,102,241,0.22) 60%, rgba(8,11,22,0.08) 100%)',
        shadow: '0 0 26px rgba(168,85,247,0.4), 0 0 68px rgba(99,102,241,0.2), inset 0 0 24px rgba(255,255,255,0.12)',
        pulseDuration: 2.7,
        floatDuration: 4,
        ringDuration: 12,
        glowScale: 1.04,
        badge: 'border-violet-300/30 bg-violet-500/10 text-violet-100',
        accent: 'from-violet-300 via-fuchsia-300 to-cyan-300',
      }
    }

    return {
      status: 'At Risk',
      message: '⚠ High distraction risk detected',
      ring: 'rgba(248,113,113,0.9)',
      track: 'rgba(248,113,113,0.14)',
      aura: 'radial-gradient(circle, rgba(248,113,113,0.26) 0%, rgba(249,115,22,0.1) 44%, rgba(0,0,0,0) 74%)',
      orb: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.62), rgba(248,113,113,0.58) 30%, rgba(249,115,22,0.18) 60%, rgba(8,11,22,0.08) 100%)',
      shadow: '0 0 22px rgba(248,113,113,0.28), 0 0 56px rgba(249,115,22,0.14), inset 0 0 18px rgba(255,255,255,0.08)',
      pulseDuration: 3.8,
      floatDuration: 5.6,
      ringDuration: 15,
      glowScale: 1.02,
      badge: 'border-red-300/30 bg-red-500/10 text-red-100',
      accent: 'from-red-300 via-orange-300 to-rose-300',
    }
  }, [productivity])

  const statusLabel = twinState?.state || avatar.status
  const statusMessage = twinState?.hint || avatar.message

  const metricCards = [
    { label: 'Productivity', value: liveScores.productivity, accent: 'cyan' },
    { label: 'Knowledge', value: liveScores.knowledge, accent: 'violet' },
    { label: 'Discipline', value: liveScores.discipline, accent: 'emerald' },
  ]

  const updatePulseKey = `${liveScores.productivity}-${liveScores.knowledge}-${liveScores.discipline}`

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - rect.left
    const offsetY = event.clientY - rect.top
    const normalizedX = (offsetX / rect.width - 0.5) * 2
    const normalizedY = (offsetY / rect.height - 0.5) * 2

    setTilt({
      x: Math.max(-8, Math.min(8, normalizedY * -7)),
      y: Math.max(-8, Math.min(8, normalizedX * 7)),
    })
  }

  return (
    <motion.div
      className="glass-panel rounded-[28px] p-6 shadow-glow"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -4 }}
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Digital twin</p>
          <h3 className="text-2xl font-semibold text-white">Holographic avatar</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium backdrop-blur ${avatar.badge}`}>
          {statusLabel}
        </span>
      </div>

      <motion.div
        className="relative mx-auto mb-5 flex h-44 w-44 items-center justify-center rounded-full border border-white/15 backdrop-blur-xl"
        style={{
          backgroundImage: goalVisual.shell,
          boxShadow: avatar.shadow,
          transformStyle: 'preserve-3d',
        }}
        animate={{ rotateX: tilt.x, rotateY: tilt.y }}
        transition={{ type: 'spring', stiffness: 170, damping: 16, mass: 0.6 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        whileHover={{ scale: 1.03 }}
      >
        <motion.div
          className="absolute -inset-8 rounded-full blur-2xl"
          style={{ backgroundImage: avatar.aura }}
          animate={{ opacity: [0.45, 0.95, 0.45], scale: [1, avatar.glowScale, 1] }}
          transition={{ duration: avatar.pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
        />

        <motion.div
          key={updatePulseKey}
          className="absolute inset-0 rounded-full"
          initial={{ scale: 0.92, opacity: 0.82 }}
          animate={{ scale: [0.92, 1.04, 1], opacity: [0.82, 1, 0.94] }}
          transition={{ duration: 0.62, ease: 'easeOut' }}
        />

        <motion.div
          className="absolute inset-2 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${avatar.track} 0deg, ${avatar.ring} ${Math.round((productivity / 100) * 360)}deg, ${avatar.track} 360deg)`,
            boxShadow: `0 0 20px ${avatar.ring}`,
            maskImage: 'radial-gradient(circle, transparent 66%, black 67%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 66%, black 67%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: avatar.ringDuration, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          className="absolute inset-4 rounded-full"
          style={{
            background: `conic-gradient(from 180deg, rgba(255,255,255,0) 0deg, ${avatar.ring} 70deg, rgba(255,255,255,0) 140deg, ${avatar.track} 260deg, rgba(255,255,255,0) 360deg)`,
            maskImage: 'radial-gradient(circle, transparent 70%, black 71%)',
            WebkitMaskImage: 'radial-gradient(circle, transparent 70%, black 71%)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: avatar.ringDuration * 1.3, repeat: Infinity, ease: 'linear' }}
        />

        {Array.from({ length: 8 }).map((_, index) => (
          <motion.div
            key={`particle-${index}`}
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: avatar.ringDuration + index * 1.2, repeat: Infinity, ease: 'linear' }}
            style={{ transform: `rotate(${index * 45}deg)` }}
          >
            <motion.div
              className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: avatar.ring, boxShadow: `0 0 12px ${avatar.ring}` }}
              animate={{ opacity: [0.35, 1, 0.35], scale: [0.8, 1.25, 0.8] }}
              transition={{ duration: avatar.pulseDuration + index * 0.18, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        ))}

        <motion.div
          className="absolute inset-[28px] rounded-full"
          style={{ backgroundImage: avatar.orb, boxShadow: avatar.shadow }}
        animate={{
            scale: [1, 1.03, 1],
            y: [0, -6, 0],
        }}
        transition={{
            duration: avatar.floatDuration,
            repeat: Infinity,
            ease: 'easeInOut',
        }}
        />

        <div className="relative z-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.34em] text-slate-300/80">AI twin</p>
          <motion.p
            key={averageScore}
            initial={{ scale: 0.95, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.35 }}
            className={`mt-2 bg-gradient-to-r ${avatar.accent} bg-clip-text text-4xl font-semibold text-transparent`}
          >
            {averageScore}
          </motion.p>
          <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-200/75">{goalVisual.title}</p>
        </div>
      </motion.div>

      <p className="text-sm leading-6 text-slate-300">{statusMessage}</p>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        {metricCards.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
            <motion.p
              key={`${metric.label}-${metric.value}`}
              initial={{ y: 4, opacity: 0.7 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className={`mt-2 text-xl font-semibold ${metric.accent === 'cyan' ? 'text-cyan-300' : metric.accent === 'violet' ? 'text-fuchsia-300' : 'text-emerald-300'}`}
            >
              {metric.value}
            </motion.p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${metric.accent === 'cyan' ? 'from-cyan-300 to-sky-400' : metric.accent === 'violet' ? 'from-violet-300 to-fuchsia-400' : 'from-emerald-300 to-cyan-300'}`}
                initial={false}
                animate={{ width: `${metric.value}%` }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Evolution trace</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Live signal history</p>
        </div>
        <div className="flex items-end gap-1.5">
          {history.slice(-10).map((item, index) => (
            <motion.div
              key={`${item.log_date || index}`}
              className="flex-1"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
            >
              <div className="mx-auto mb-2 h-2 w-2 rounded-full" style={{ backgroundColor: avatar.ring, boxShadow: `0 0 16px ${avatar.ring}` }} />
              <div className="overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="rounded-full"
                  style={{
                    height: `${Math.max(18, Math.min(74, Math.round((Number(item.score || 0) * 0.8) + 14)))}px`,
                    backgroundImage: `linear-gradient(180deg, ${avatar.ring}, rgba(255,255,255,0.12))`,
                    boxShadow: `0 0 18px ${avatar.ring}`,
                  }}
                  animate={{ opacity: [0.72, 1, 0.72] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

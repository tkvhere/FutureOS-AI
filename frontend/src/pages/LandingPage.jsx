import { useState } from 'react'

const architectureSteps = [
  ['Input Layer', 'Log study, sleep, focus, and movement every day.'],
  ['Simulation Layer', 'Project 30 / 90 / 180 day outcomes from your behavior stream.'],
  ['Policy Layer', 'Select the next best action from the MDP recommendation engine.'],
  ['Feedback Layer', 'Close the loop with forecast confidence, streaks, and coaching.'],
]

const particles = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: `${8 + (index * 6.2) % 86}%`,
  top: `${10 + (index * 7.4) % 80}%`,
  delay: `${(index % 6) * 0.65}s`,
  duration: `${7 + (index % 5)}s`,
}))

export default function LandingPage({ onSignIn, onSignUp }) {
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [cursorTrail, setCursorTrail] = useState([])

  const handleParallax = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 14
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 14
    setParallax({ x, y })

    const point = {
      id: Date.now() + Math.random(),
      left: event.clientX - bounds.left,
      top: event.clientY - bounds.top,
    }
    setCursorTrail((current) => [...current.slice(-7), point])
  }

  return (
    <section
      className="landing-shell relative overflow-hidden rounded-[40px] border border-white/10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14"
      onMouseMove={handleParallax}
      onMouseLeave={() => {
        setParallax({ x: 0, y: 0 })
        setCursorTrail([])
      }}
    >
      <div className="landing-aurora pointer-events-none absolute inset-0" />
      <div className="landing-orbit landing-orbit-a pointer-events-none" />
      <div className="landing-orbit landing-orbit-b pointer-events-none" />
      <div className="landing-orbit landing-orbit-c pointer-events-none" />
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-0">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="landing-particle"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.delay,
              animationDuration: particle.duration,
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0">
        {cursorTrail.map((point, index) => (
          <span
            key={point.id}
            className="cursor-trail-dot"
            style={{
              left: `${point.left}px`,
              top: `${point.top}px`,
              opacity: (index + 1) / cursorTrail.length,
              transform: `translate(-50%, -50%) scale(${0.55 + ((index + 1) / cursorTrail.length) * 1.2})`,
            }}
          />
        ))}
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="space-y-7" style={{ transform: `translate3d(${parallax.x * -0.25}px, ${parallax.y * -0.25}px, 0)` }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-100">
            Future You Architecture
          </div>

          <h1 className="landing-title max-w-2xl font-title text-5xl font-semibold leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            Design your future like a living system, not a random streak.
          </h1>

          <p className="max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
            This is not a normal habit app. It is a behavior architecture studio: daily inputs become simulations, decisions, and trajectory corrections you can actually act on.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onSignIn}
              className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(255,255,255,0.22)]"
            >
              Enter Command Center
            </button>
            <button
              onClick={onSignUp}
              className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/10"
            >
              Create New Identity
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ['360 View', 'Habits + simulation + coaching'],
              ['Forecast Core', 'Trend + LSTM fallback'],
              ['Decision Loop', 'MDP-guided next move'],
            ].map(([label, value], index) => (
              <article
                key={label}
                className="landing-stat-card rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
                <p className="mt-2 text-sm font-medium text-white">{value}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="landing-blueprint relative overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/45 p-6 backdrop-blur-xl" style={{ transform: `translate3d(${parallax.x * 0.25}px, ${parallax.y * 0.25}px, 0)` }}>
          <div className="landing-scanline pointer-events-none absolute inset-0" />
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">System Blueprint</p>
            <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
              Live architecture
            </span>
          </div>

          <div className="space-y-3">
            {architectureSteps.map(([title, value], index) => (
              <div key={title} className="landing-step group rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/90">Step {index + 1}: {title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm text-amber-100">
            Your sign-out path returns here so every session restarts at the strategic overview before authentication.
          </div>
        </aside>
      </div>
    </section>
  )
}

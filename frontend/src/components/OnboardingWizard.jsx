import { useMemo, useState } from 'react'

const STEPS = [
  {
    title: 'Set Your Baseline',
    body: 'Log one honest day of habits so the simulator starts from reality, not guesses.',
  },
  {
    title: 'Run Future Scenarios',
    body: 'Use simulation and comparison panels to see where your current path leads.',
  },
  {
    title: 'Follow Coach Signals',
    body: 'Use MDP and forecast warnings to decide one concrete action each day.',
  },
]

export default function OnboardingWizard({ onComplete, onSkip }) {
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]

  const progress = useMemo(() => {
    return Math.round(((stepIndex + 1) / STEPS.length) * 100)
  }, [stepIndex])

  const isLast = stepIndex === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-2xl rounded-[32px] p-6 shadow-glow">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Onboarding</p>
          <button onClick={onSkip} className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:bg-white/10">
            Skip
          </button>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-aurora-500 to-ember-500" style={{ width: `${progress}%` }} />
        </div>

        <p className="text-sm text-slate-400">Step {stepIndex + 1} of {STEPS.length}</p>
        <h3 className="mt-2 text-3xl font-semibold text-white">{step.title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-300">{step.body}</p>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
            disabled={stepIndex === 0}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10 disabled:opacity-40"
          >
            Back
          </button>

          {isLast ? (
            <button onClick={onComplete} className="rounded-2xl bg-gradient-to-r from-aurora-500 to-ember-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]">
              Finish setup
            </button>
          ) : (
            <button
              onClick={() => setStepIndex((value) => Math.min(STEPS.length - 1, value + 1))}
              className="rounded-2xl bg-white px-5 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.01]"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

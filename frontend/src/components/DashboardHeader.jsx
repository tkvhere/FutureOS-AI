export default function DashboardHeader({ user, onLogout }) {
  return (
    <div className="glass-panel rounded-[32px] p-6 shadow-glow">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Life Outcome Simulator</p>
          <h1 className="mt-2 text-4xl font-semibold text-white">Hello, {user?.name || 'Explorer'}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Track habits, forecast the next chapter, and let the coach translate your daily behavior into a better future.
          </p>
        </div>
      </div>
    </div>
  )
}

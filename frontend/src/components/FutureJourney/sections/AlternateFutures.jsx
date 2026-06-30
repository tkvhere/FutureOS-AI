export default function AlternateFutures() {
  return (
    <section className="bg-[#050816] py-24">
      <div className="mx-auto max-w-7xl px-8">

        <div className="mb-14 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-cyan-400">
            ALTERNATE FUTURES
          </p>

          <h2 className="mt-5 text-5xl font-bold text-white">
            Your Future Depends on Today's Decisions
          </h2>

          <p className="mt-5 text-lg text-slate-400">
            Compare where your current habits will take you versus an optimized path.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">

          <div className="rounded-3xl border border-red-500/20 bg-[#0B1224] p-10">
            <p className="text-red-400 font-semibold">
              Current Path
            </p>

            <h3 className="mt-5 text-3xl font-bold text-white">
              32% Success Chance
            </h3>

            <ul className="mt-6 space-y-3 text-slate-400">
              <li>• Slow Progress</li>
              <li>• Missed Opportunities</li>
              <li>• Inconsistent Routine</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-[#0B1224] p-10">
            <p className="text-emerald-400 font-semibold">
              Optimized Path
            </p>

            <h3 className="mt-5 text-3xl font-bold text-white">
              87% Success Chance
            </h3>

            <ul className="mt-6 space-y-3 text-slate-300">
              <li>✓ Daily Learning</li>
              <li>✓ AI Guided Roadmap</li>
              <li>✓ Consistent Habits</li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
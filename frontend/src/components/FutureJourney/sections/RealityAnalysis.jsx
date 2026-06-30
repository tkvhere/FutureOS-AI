export default function RealityAnalysis() {
  return (
    <section className="bg-[#050816] py-24">

      <div className="mx-auto max-w-7xl px-8">

        <div className="mb-14 text-center">

          <p className="text-cyan-400 uppercase tracking-[0.4em] text-sm">
            REALITY ANALYSIS
          </p>

          <h2 className="mt-5 text-5xl font-bold text-white">
            Where Are You Today?
          </h2>

          <p className="mt-5 text-lg text-slate-400">
            AI evaluates your current position before creating your roadmap.
          </p>

        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-8">
            <p className="text-slate-400">Current Performance</p>
            <h3 className="mt-3 text-4xl font-bold text-white">74%</h3>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-8">
            <p className="text-slate-400">Success Probability</p>
            <h3 className="mt-3 text-4xl font-bold text-cyan-400">82%</h3>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-8">
            <p className="text-slate-400">Goal Difficulty</p>
            <h3 className="mt-3 text-4xl font-bold text-orange-400">
              Medium
            </h3>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-8">
            <p className="text-slate-400">Estimated Time</p>
            <h3 className="mt-3 text-4xl font-bold text-emerald-400">
              318 Days
            </h3>
          </div>

        </div>

      </div>

    </section>
  );
}
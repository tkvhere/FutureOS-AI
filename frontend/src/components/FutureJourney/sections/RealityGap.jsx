export default function RealityGap() {
  return (
    <section className="bg-[#050816] py-24">
      <div className="mx-auto max-w-7xl px-8">

        <div className="mb-14 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-cyan-400">
            REALITY GAP
          </p>

          <h2 className="mt-5 text-5xl font-bold text-white">
            How Far Are You From Your Dream?
          </h2>

          <p className="mt-5 text-lg text-slate-400">
            Compare your current self with your future self.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">

          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-10">
            <p className="text-slate-400">Current You</p>

            <h3 className="mt-5 text-3xl font-bold text-white">
              Beginner
            </h3>

            <ul className="mt-6 space-y-3 text-slate-400">
              <li>• Inconsistent Habits</li>
              <li>• Basic Skills</li>
              <li>• Low Confidence</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-cyan-400/30 bg-[#0B1224] p-10">
            <p className="text-cyan-400">Future You</p>

            <h3 className="mt-5 text-3xl font-bold text-white">
              AI Engineer
            </h3>

            <ul className="mt-6 space-y-3 text-slate-300">
              <li>✓ Strong Portfolio</li>
              <li>✓ Industry Skills</li>
              <li>✓ High Consistency</li>
            </ul>
          </div>

        </div>

      </div>
    </section>
  );
}
export default function DreamResult({ result }) {
  if (!result) return null;

  return (
    <section className="bg-[#050816] py-20">
      <div className="mx-auto max-w-6xl px-8">

        <h2 className="mb-10 text-center text-4xl font-bold text-white">
          AI Dream Analysis
        </h2>

        <div className="grid gap-6 md:grid-cols-2">

          {/* Goal */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-6">
            <p className="text-slate-400">🎯 Goal</p>
            <h3 className="mt-2 text-2xl font-bold text-white">
              {result.goal}
            </h3>
          </div>

          {/* Category */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-6">
            <p className="text-slate-400">💻 Category</p>
            <h3 className="mt-2 text-2xl font-bold text-cyan-400">
              {result.category}
            </h3>
          </div>

          {/* Difficulty */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-6">
            <p className="text-slate-400">⚡ Difficulty</p>
            <h3 className="mt-2 text-2xl font-bold text-orange-400">
              {result.difficulty}
            </h3>
          </div>

          {/* Duration */}
          <div className="rounded-3xl border border-white/10 bg-[#0B1224] p-6">
            <p className="text-slate-400">⏳ Estimated Duration</p>
            <h3 className="mt-2 text-2xl font-bold text-green-400">
              {result.estimated_duration}
            </h3>
          </div>

        </div>

        {/* Skills */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#0B1224] p-6">

          <p className="mb-5 text-slate-400 text-lg">
            🛠 Required Skills
          </p>

          <div className="flex flex-wrap gap-3">
            {result.required_skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-cyan-500/20 px-4 py-2 text-cyan-300 font-medium"
              >
                {skill}
              </span>
            ))}
          </div>

        </div>

        {/* Confidence */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#0B1224] p-6">

          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-lg">
              🎯 AI Confidence
            </p>

            <span className="text-cyan-400 font-bold">
              {(result.confidence * 100).toFixed(0)}%
            </span>
          </div>

          <div className="mt-4 h-3 w-full rounded-full bg-slate-700 overflow-hidden">

            <div
              className="h-full rounded-full bg-cyan-400 transition-all duration-700"
              style={{
                width: `${result.confidence * 100}%`,
              }}
            />

          </div>

        </div>

      </div>
    </section>
  );
}
export default function StartJourneyCTA() {
  return (
    <section className="bg-[#050816] py-24">
      <div className="mx-auto max-w-5xl px-8">

        <div className="rounded-[32px] border border-cyan-400/20 bg-[#0B1224] p-14 text-center">

          <p className="text-sm uppercase tracking-[0.4em] text-cyan-400">
            START JOURNEY
          </p>

          <h2 className="mt-5 text-5xl font-bold text-white">
            Your Future Starts Today
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Commit to your roadmap and begin transforming your future with AI guidance.
          </p>

          <button className="mt-10 rounded-2xl bg-cyan-400 px-10 py-4 text-lg font-bold text-black transition hover:scale-105">
            Start My Journey
          </button>

        </div>

      </div>
    </section>
  );
}
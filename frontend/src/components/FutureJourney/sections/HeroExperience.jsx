export default function HeroExperience() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[#050816]">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#22d3ee22,transparent_40%),radial-gradient(circle_at_bottom_left,#8b5cf622,transparent_40%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center justify-between px-10">

        <div className="max-w-3xl">

          <p className="mb-4 text-sm uppercase tracking-[0.5em] text-cyan-400">
            FUTURE JOURNEY
          </p>

          <h1 className="text-7xl font-black leading-tight text-white">
            Become
            <br />
            Your Future Self
          </h1>

          <p className="mt-8 text-xl leading-9 text-slate-400">
            Build your dream with AI-powered roadmap,
            Digital Twin evolution and personalized guidance.
          </p>

          <button className="mt-12 rounded-2xl bg-cyan-400 px-8 py-4 font-bold text-black transition hover:scale-105">
            Start Journey
          </button>

        </div>

        <div className="h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />

      </div>

    </section>
  );
}
import { useState } from "react";
import { apiRequest } from "../../../services/api";


export default function RealityAnalysis() {
  const [form, setForm] = useState({
    education: "",
    cgpa: "",
    experience: "",
    study_hours: "",
    skills: "",
  });
  
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const analyzeReality = async () => {
  try {
    const response = await apiRequest("/reality/analyze", {
      method: "POST",
      body: form,
    });

    setResult(response);
  } catch (error) {
    console.error(error);
  }
};

  return (
    <section className="bg-[#050816] py-24">
      <div className="mx-auto max-w-6xl px-8">

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

        <div className="grid gap-6 md:grid-cols-2">

          <input
            name="education"
            placeholder="Current Education"
            value={form.education}
            onChange={handleChange}
            className="rounded-2xl bg-[#0B1224] p-4 text-white border border-white/10"
          />

          <input
            name="cgpa"
            placeholder="CGPA"
            value={form.cgpa}
            onChange={handleChange}
            className="rounded-2xl bg-[#0B1224] p-4 text-white border border-white/10"
          />

          <input
            name="experience"
            placeholder="Experience (Beginner / Intermediate)"
            value={form.experience}
            onChange={handleChange}
            className="rounded-2xl bg-[#0B1224] p-4 text-white border border-white/10"
          />

          <input
            name="study_hours"
            placeholder="Study Hours Per Day"
            value={form.study_hours}
            onChange={handleChange}
            className="rounded-2xl bg-[#0B1224] p-4 text-white border border-white/10"
          />

        </div>

        <textarea
          name="skills"
          rows={4}
          placeholder="Current Skills (Python, SQL, Excel...)"
          value={form.skills}
          onChange={handleChange}
          className="mt-6 w-full rounded-2xl bg-[#0B1224] p-4 text-white border border-white/10"
        />

        <button
        
          onClick={analyzeReality}
          className="mt-8 w-full rounded-2xl bg-cyan-400 py-4 text-lg font-bold text-black hover:scale-[1.02] transition"
        >
          Analyze My Reality
        </button>
        {/* Reality Dashboard */}
        {result && (
  <div className="mt-10 rounded-3xl border border-cyan-400/20 bg-[#0B1224] p-8 text-white shadow-2xl">
    <div className="mb-8 flex items-center justify-between">
  <div>
    <p className="text-cyan-400 uppercase tracking-[0.3em] text-sm">
      AI REPORT
    </p>

    <h2 className="text-4xl font-bold mt-2">
      Reality Dashboard
    </h2>
  </div>
   <div className="text-right">

  <div className="rounded-2xl bg-cyan-400 px-6 py-3 text-black inline-block">
    <p className="text-sm font-semibold">
      Readiness
    </p>

    <h1 className="text-3xl font-bold">
      {result.readiness}%
    </h1>
  </div>

  <div className="mt-4 w-52">
    <div className="h-3 overflow-hidden rounded-full bg-slate-700">
      <div
        className="h-full rounded-full bg-cyan-400 transition-all duration-700"
        style={{ width: `${result.readiness}%` }}
      />
    </div>
  </div>

</div>
</div>

    <div className="grid gap-6 md:grid-cols-2 mb-8">

  <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
    <p className="text-slate-400 text-sm uppercase">
      Education
    </p>

    <h3 className="mt-2 text-2xl font-bold">
      {result.education}
    </h3>
  </div>

  <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
    <p className="text-slate-400 text-sm uppercase">
      Success Probability
    </p>

    <h3 className="mt-2 text-2xl font-bold text-cyan-400">
      {result.success_probability}%
    </h3>
  </div>

</div>

    <div className="grid gap-6 md:grid-cols-2 mb-8">

  <div className="rounded-2xl border border-green-500/20 bg-[#111827] p-6">
    <h3 className="mb-4 text-xl font-bold text-green-400">
      Strengths
    </h3>

    <ul className="space-y-2">
      {result.strengths?.map((skill) => (
        <li key={skill} className="flex items-center gap-2">
          <span>✅</span>
          <span>{skill}</span>
        </li>
      ))}
    </ul>
  </div>

  <div className="rounded-2xl border border-yellow-500/20 bg-[#111827] p-6">
    <h3 className="mb-4 text-xl font-bold text-yellow-400">
      Areas to Improve
    </h3>

    <ul className="space-y-2">
      {result.weaknesses?.map((item) => (
        <li key={item} className="flex items-center gap-2">
          <span>⚠️</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>

</div>

    <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-[#111827] p-6">

  <p className="text-cyan-400 uppercase tracking-widest text-sm">
    AI INSIGHT
  </p>

  <h3 className="mt-2 text-2xl font-bold">
    Personalized Recommendation
  </h3>

  <p className="mt-4 leading-8 text-slate-300">
    {result.recommendation}
  </p>

</div>


<div className="mt-8 rounded-2xl bg-cyan-400 p-6 text-black">

  <p className="text-sm font-bold uppercase">
    NEXT STEP
  </p>

  <h2 className="mt-2 text-3xl font-bold">
    Generate Your AI Roadmap
  </h2>

  <p className="mt-3">
    FutureOS can now generate your personalized roadmap using this analysis.
  </p>

  <button
  // TODO: Connect to AI Roadmap Generator
  onClick={() => console.log("Generate Roadmap")}
  className="mt-6 rounded-xl bg-black px-6 py-3 text-white transition hover:bg-slate-900"
>
  Generate Roadmap →
</button>

</div>
  </div>
)}

      </div>
    </section>
  );
}
import { useState } from "react";
import { apiRequest } from "../../../services/api";
import DreamResult from "./DreamResult";
export default function DreamCenter() {
  const [dream, setDream] = useState("");
  const [result, setResult] = useState(null);
  const analyzeDream = async () => {
  try {
    const response = await apiRequest("/dream/analyze", {
      method: "POST",
      body: {
        dream: dream,
      },
    });

    setResult(response);

  } catch (error) {
    console.error(error);
  }
};

  return (
    <section className="bg-[#050816] py-24">
        

      <div className="mx-auto max-w-7xl px-8">

        <div className="mb-12 text-center">

          <p className="text-cyan-400 uppercase tracking-[0.4em] text-sm">
            DREAM CENTER
          </p>

          <h2 className="mt-5 text-5xl font-bold text-white">
            What Do You Want To Become?
          </h2>

          <p className="mt-6 text-slate-400 text-lg">
            Your journey begins with one dream.
          </p>

        </div>

        <div className="mx-auto max-w-3xl">

          <textarea
            rows={5}
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            placeholder="Example: I want to become a Data Scientist at Google."
            className="w-full rounded-3xl border border-white/10 bg-[#0B1224] p-6 text-lg text-white outline-none transition focus:border-cyan-400"
          />

          <button
            onClick={analyzeDream}
            className="mt-8 w-full rounded-2xl bg-cyan-400 py-4 text-lg font-bold text-black transition hover:scale-[1.02]"
          >
            Analyze My Dream
          </button>

          

        </div>

        

      </div>

      <DreamResult result={result} />

    </section>
  );
}
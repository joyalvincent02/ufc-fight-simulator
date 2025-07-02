import { useState } from "react";
import { simulateCustomFight } from "../services/api";
import Spinner from "../components/Spinner";

export default function CustomSimPage() {
  const [fighterA, setFighterA] = useState("");
  const [fighterB, setFighterB] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const data = await simulateCustomFight(fighterA, fighterB);
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Custom Simulation</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            value={fighterA}
            onChange={(e) => setFighterA(e.target.value)}
            placeholder="Fighter A (e.g., Max Holloway)"
            className="flex-1 px-4 py-2 rounded bg-gray-800 text-white"
          />
          <input
            value={fighterB}
            onChange={(e) => setFighterB(e.target.value)}
            placeholder="Fighter B (e.g., Dustin Poirier)"
            className="flex-1 px-4 py-2 rounded bg-gray-800 text-white"
          />
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-semibold shadow disabled:opacity-50"
        >
          {loading ? "Simulating..." : "Simulate Fight"}
        </button>

        {error && (
          <p className="mt-4 text-red-400 text-sm font-medium">{error}</p>
        )}

        {loading && (
          <div className="flex justify-center mt-8">
            <Spinner />
          </div>
        )}

        {result && (
          <div className="mt-10 bg-white/5 p-6 rounded-lg border border-white/10 backdrop-blur">
            <h2 className="text-xl font-semibold mb-4 text-center">
              {result.fighters[0].name} vs {result.fighters[1].name}
            </h2>

            <div className="flex justify-center items-center gap-8 mb-6">
              {result.fighters.map((f: any, i: number) => (
                <div key={i} className="flex flex-col items-center">
                  <img
                    src={
                      f.image ||
                      "https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png"
                    }
                    alt={f.name}
                    className="w-24 h-24 rounded-full border object-cover"
                  />
                  <p className="mt-2 font-medium text-sm">{f.name}</p>
                </div>
              ))}
            </div>

            <div className="text-center text-sm text-gray-300 space-y-1">
              <p>
                <strong>{result.fighters[0].name} Win %:</strong>{" "}
                {(result.probabilities.P_A * 100).toFixed(1)}%
              </p>
              <p>
                <strong>{result.fighters[1].name} Win %:</strong>{" "}
                {(result.probabilities.P_B * 100).toFixed(1)}%
              </p>
              <p>
                <strong>Neutral Exchange Chance:</strong>{" "}
                {(result.probabilities.P_neutral * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

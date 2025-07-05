import { useEffect, useState } from "react";
import { simulateCustomFight, getFighters } from "../services/api";
import Spinner from "../components/Spinner";

const FALLBACK_IMAGE =
  "https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png";

const winnerColor = "#015a3c";
const loserColor = "#ca2320";
const neutralColor = "#d65500";

type Fighter = { name: string; image?: string };

export default function CustomSimPage() {
  const [fighterA, setFighterA] = useState("");
  const [fighterB, setFighterB] = useState("");
  const [suggestions, setSuggestions] = useState<Fighter[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [activeField, setActiveField] = useState<"A" | "B" | null>(null);
  const [model, setModel] = useState("ensemble");

  useEffect(() => {
    getFighters().then(setFighters).catch(console.error);
  }, []);

  useEffect(() => {
    if (fighterA && fighterB && result) {
      handleSimulate();
    }
  }, [model]);

  const handleInputChange = (value: string, which: "A" | "B") => {
    if (which === "A") setFighterA(value);
    else setFighterB(value);

    setActiveField(which);
    const filtered = fighters.filter(f =>
      f.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 5));
  };

  const handleSelectSuggestion = (name: string) => {
    if (activeField === "A") setFighterA(name);
    else setFighterB(name);
    setSuggestions([]);
    setActiveField(null);
  };

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const data = await simulateCustomFight(fighterA, fighterB, model);
      if (data.error) setError(data.error);
      else setResult(data);
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-center">Custom Simulation</h1>

        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            <label htmlFor="model" className="text-white font-medium whitespace-nowrap">
              Prediction Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 disabled:opacity-50"
            >
              <option value="ensemble">Ensemble</option>
              <option value="ml">Machine Learning</option>
              <option value="sim">Simulation</option>
            </select>
            {loading && result && (
              <span className="text-yellow-400 text-sm ml-2">⟳ Updating...</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 relative">
          <div className="flex-1 relative">
            <input
              value={fighterA}
              onChange={(e) => handleInputChange(e.target.value, "A")}
              onFocus={() => setActiveField("A")}
              placeholder="Fighter A (e.g., Max Holloway)"
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {activeField === "A" && suggestions.length > 0 && (
              <ul className="absolute bg-gray-800 border border-gray-700 rounded-lg mt-1 w-full max-h-48 overflow-auto z-20">
                {suggestions.map((f, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectSuggestion(f.name)}
                    className="px-4 py-2 hover:bg-red-600 cursor-pointer text-sm"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex-1 relative">
            <input
              value={fighterB}
              onChange={(e) => handleInputChange(e.target.value, "B")}
              onFocus={() => setActiveField("B")}
              placeholder="Fighter B (e.g., Dustin Poirier)"
              className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {activeField === "B" && suggestions.length > 0 && (
              <ul className="absolute bg-gray-800 border border-gray-700 rounded-lg mt-1 w-full max-h-48 overflow-auto z-20">
                {suggestions.map((f, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSelectSuggestion(f.name)}
                    className="px-4 py-2 hover:bg-red-600 cursor-pointer text-sm"
                  >
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-400 mb-4">
            ⚠️ Not all fighters are available yet but the database is continuously being updated.
          </p>
          <button
            onClick={handleSimulate}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg font-semibold shadow text-white disabled:opacity-50 transition"
          >
            {loading ? "Simulating..." : "Simulate Fight"}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-red-500 text-center text-sm font-medium">{error}</p>
        )}

        {loading && (
          <div className="flex justify-center mt-10">
            <Spinner />
          </div>
        )}

        {result && (
          <div className="mt-10 bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg text-white">
            <h2 className="text-2xl font-semibold text-center mb-6">
              {result.fighters?.[0]?.name || fighterA} vs {result.fighters?.[1]?.name || fighterB}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[fighterA, fighterB].map((name, idx) => {
                const winPct = result.results?.[name] || 0;
                const otherWinPct = result.results?.[[fighterA, fighterB][1 - idx]] || 0;
                const drawPct = result.results?.["Draw"] || 0;
                const image = result.fighters?.[idx]?.image || FALLBACK_IMAGE;

                let borderColor = "#ffffff";
                if (drawPct >= 45) {
                  borderColor = neutralColor;
                } else if (winPct > otherWinPct) {
                  borderColor = winnerColor;
                } else if (winPct < otherWinPct) {
                  borderColor = loserColor;
                }

                return (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <img
                      src={image}
                      alt={name}
                      style={{ borderColor }}
                      className="w-24 h-24 rounded-full object-cover border-4 mb-3"
                    />
                    <p className="text-lg font-bold">{name}</p>
                    <p className="text-sm text-gray-300">Win %: {winPct.toFixed(1)}%</p>
                    {result.probabilities && (
                      <p className="text-sm text-gray-400">
                        Exchange Chance:{" "}
                        {(
                          (idx === 0
                            ? result.probabilities.P_A
                            : result.probabilities.P_B) * 100
                        ).toFixed(2)}%
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {result.probabilities && (
              <div className="mt-6 text-center text-sm text-gray-300">
                Neutral Exchanges: {(result.probabilities.P_neutral * 100).toFixed(2)}% &nbsp;|&nbsp;
                Draws: {result.results?.["Draw"]?.toFixed(1) || "0.0"}%
              </div>
            )}

            {result.penalty_score !== undefined && result.diffs && model !== "sim" && (
              <div className="mt-6">
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg border border-blue-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <h3 className="font-semibold text-blue-300">
                      {model === "ml" ? "ML Model Analysis" : "Ensemble Model Analysis"}
                    </h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 text-sm">
                    <div className="flex-1 bg-black/20 p-4 rounded-lg border border-white/10 flex flex-col justify-center items-center text-center">
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Mismatch Penalty</p>
                      <p className="text-3xl font-bold text-yellow-400">{(result.penalty_score * 100).toFixed(1)}%</p>
                    </div>

                    <div className="flex-[2] bg-black/20 p-4 rounded-lg border border-white/10">
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Physical Advantages</p>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-xs">
                        <div className="flex items-center">
                          <span className="text-gray-300 min-w-[52px]">Weight:</span>
                          <span className="text-white font-medium">
                            {result.diffs.weight_diff === 0 ? "Even" :
                              `${result.diffs.weight_diff > 0 ? fighterA : fighterB} +${Math.abs(result.diffs.weight_diff)}lbs`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-300 min-w-[52px]">Height:</span>
                          <span className="text-white font-medium">
                            {result.diffs.height_diff === 0 ? "Even" :
                              `${result.diffs.height_diff > 0 ? fighterA : fighterB} +${Math.abs(result.diffs.height_diff)}"`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-300 min-w-[52px]">Reach:</span>
                          <span className="text-white font-medium">
                            {result.diffs.reach_diff === 0 ? "Even" :
                              `${result.diffs.reach_diff > 0 ? fighterA : fighterB} +${Math.abs(result.diffs.reach_diff)}"`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-300 min-w-[52px]">Age:</span>
                          <span className="text-white font-medium">
                            {result.diffs.age_diff === 0 ? "Even" :
                              `${result.diffs.age_diff < 0 ? fighterA : fighterB} ${Math.abs(result.diffs.age_diff)}yrs younger`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <span>
                        {result.penalty_score > 0.3
                          ? "High mismatch detected - significant physical differences"
                          : result.penalty_score > 0.15
                            ? "Moderate mismatch - notable physical differences"
                            : "Low mismatch - similar physical attributes"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

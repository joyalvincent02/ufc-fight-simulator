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

  useEffect(() => {
    getFighters().then(setFighters).catch(console.error);
  }, []);

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
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-center">Custom Simulation</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 relative">
          {/* Fighter A Input */}
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

          {/* Fighter B Input */}
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
          <p className="text-sm text-gray-400 text-center mb-4">
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
              {result.fighters[0].name} vs {result.fighters[1].name}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {result.fighters.map((f: any, idx: number) => {
                const winPct = result.results[f.name] || 0;
                const otherWinPct = result.results[result.fighters[1 - idx].name] || 0;
                const drawPct = result.results["Draw"] || 0;

                let borderColor = "#ffffff"; // default
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
                      src={f.image || FALLBACK_IMAGE}
                      alt={f.name}
                      style={{ borderColor }}
                      className="w-24 h-24 rounded-full object-cover border-4 mb-3"
                    />
                    <p className="text-lg font-bold">{f.name}</p>
                    <p className="text-sm text-gray-300">
                      Win %: {winPct.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-400">
                      Exchange Chance:{" "}
                      {(
                        (idx === 0
                          ? result.probabilities.P_A
                          : result.probabilities.P_B) * 100
                      ).toFixed(2)}
                      %
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center text-sm text-gray-300">
              Neutral Exchanges: {(result.probabilities.P_neutral * 100).toFixed(2)}% &nbsp;|&nbsp;
              Draws: {result.results["Draw"]?.toFixed(1) || "0.0"}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

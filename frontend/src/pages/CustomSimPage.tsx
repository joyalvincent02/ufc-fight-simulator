import { useEffect, useState } from "react";
import { simulateCustomFight, getFighters } from "../services/api";
import Spinner from "../components/Spinner";
import ModelSelector from "../components/ModelSelector";
import FighterCard from "../components/FighterCard";
import ModelAnalysis from "../components/ModelAnalysis";
import PageLayout from "../components/PageLayout";
import FighterInput from "../components/FighterInput";

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
    <PageLayout title="Custom Simulation">
      <ModelSelector 
        model={model} 
        onModelChange={setModel} 
        loading={loading}
        showLoadingIndicator={!!result}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6 relative">
        <FighterInput
          value={fighterA}
          onChange={(value) => handleInputChange(value, "A")}
          onFocus={() => setActiveField("A")}
          placeholder="Fighter A (e.g., Max Holloway)"
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          showSuggestions={activeField === "A"}
        />

        <FighterInput
          value={fighterB}
          onChange={(value) => handleInputChange(value, "B")}
          onFocus={() => setActiveField("B")}
          placeholder="Fighter B (e.g., Dustin Poirier)"
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          showSuggestions={activeField === "B"}
        />
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
        <p className="mt-4 text-red-600 dark:text-red-400 text-center text-sm font-medium">{error}</p>
      )}

      {loading && (
        <div className="flex justify-center mt-10">
          <Spinner />
        </div>
      )}

      {result && (
        <div className="mt-10 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg text-gray-900 dark:text-white">
          <h2 className="text-2xl font-semibold text-center mb-6 text-gray-900 dark:text-white">
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
                <FighterCard
                  key={idx}
                  name={name}
                  image={image}
                  winPercentage={winPct}
                  exchangeChance={result.probabilities ? (idx === 0 ? result.probabilities.P_A : result.probabilities.P_B) : undefined}
                  borderColor={borderColor}
                  showExchangeChance={!!result.probabilities}
                />
              );
            })}
          </div>

          {result.probabilities && (
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
              Neutral Exchanges: {(result.probabilities.P_neutral * 100).toFixed(2)}% &nbsp;|&nbsp;
              Draws: {result.results?.["Draw"]?.toFixed(1) || "0.0"}%
            </div>
          )}

          {result.penalty_score !== undefined && result.diffs && model !== "sim" && (
            <ModelAnalysis
              model={model}
              penaltyScore={result.penalty_score}
              diffs={result.diffs}
              fighterA={fighterA}
              fighterB={fighterB}
            />
          )}
        </div>
      )}
    </PageLayout>
  );
}

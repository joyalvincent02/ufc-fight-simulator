import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { simulateEvent } from "../services/api";
import Spinner from "../components/Spinner";

const winnerColor = "#015a3c";
const loserColor = "#ca2320";
const neutralColor = "#d65500";

type Fighter = {
  name: string;
  image?: string;
};

type SimFight = {
  fighters: [Fighter, Fighter];
  probabilities?: {
    P_A: number;
    P_B: number;
    P_neutral: number;
  };
  penalty_score?: number;
  diffs?: {
    weight_diff: number;
    height_diff: number;
    reach_diff: number;
    age_diff: number;
  };
  results: {
    [fighter: string]: number;
  };
  error?: string;
};

type SimData = {
  event: string;
  fights: SimFight[];
};

const FALLBACK_IMAGE =
  "https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png";

export default function SimulatePage() {
  const { eventId } = useParams();
  const [data, setData] = useState<SimData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState<string>("ensemble");

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    simulateEvent(eventId, model)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId, model]);

  if (loading) return <Spinner />;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Soft glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">Simulated Card: {data.event}</h1>

        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            <label htmlFor="model" className="text-white font-medium whitespace-nowrap">
              Prediction Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="ensemble">Ensemble</option>
              <option value="ml">Machine Learning</option>
              <option value="sim">Simulation</option>
            </select>
          </div>
        </div>

        <div className="space-y-8">
          {data.fights.map((fight, i) => {
            const [A, B] = fight.fighters;
            const results = fight.results;
            const drawPct = results?.["Draw"] || 0;

            const P_A = fight.probabilities?.P_A ?? null;
            const P_B = fight.probabilities?.P_B ?? null;
            const P_neutral = fight.probabilities?.P_neutral ?? null;

            // ML/Ensemble model data
            const penaltyScore = fight.penalty_score ?? null;
            const diffs = fight.diffs ?? null;

            return (
              <div
                key={i}
                className="bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg"
              >
                <h2 className="text-2xl font-semibold text-center mb-6">
                  {A.name} vs {B.name}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[A, B].map((f, idx) => {
                    const winPct = results?.[f.name] ?? 0;
                    const otherWinPct = results?.[[A, B][1 - idx].name] ?? 0;

                    let borderColor = "border-white";
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
                        {(P_A !== null && P_B !== null) && (
                          <p className="text-sm text-gray-400">
                            Exchange Chance: {(((idx === 0 ? P_A : P_B) ?? 0) * 100).toFixed(2)}%
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {P_neutral !== null && (
                  <div className="mt-6 text-center text-sm text-gray-300">
                    Neutral Exchanges: {(P_neutral * 100).toFixed(2)}% &nbsp;|&nbsp;
                    Draws: {drawPct.toFixed(1)}%
                  </div>
                )}

                {(penaltyScore !== null && diffs && model !== 'sim') && (
                  <div className="mt-6">
                    <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg border border-blue-500/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <h3 className="font-semibold text-blue-300">
                          {model === 'ml' ? 'ML Model Analysis' : 'Ensemble Model Analysis'}
                        </h3>
                      </div>

                      <div className="flex flex-col md:flex-row gap-4 text-sm">
                        {/* Mismatch Penalty */}
                        <div className="flex-1 bg-black/20 p-4 rounded-lg border border-white/10 flex flex-col justify-center items-center text-center">
                          <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Mismatch Penalty</p>
                          <p className="text-3xl font-bold text-yellow-400">{(penaltyScore * 100).toFixed(1)}%</p>
                        </div>

                        {/* Physical Advantages */}
                        <div className="flex-[2] bg-black/20 p-4 rounded-lg border border-white/10">
                          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Physical Advantages</p>
                          <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-xs">
                            {/* Weight */}
                            <div className="flex items-center">
                              <span className="text-gray-300 min-w-[52px]">Weight:</span>
                              <span className="text-white font-medium">{diffs.weight_diff === 0 ? 'Even' :
                                `${diffs.weight_diff > 0 ? A.name : B.name} +${Math.abs(diffs.weight_diff)}lbs`}
                              </span>
                            </div>

                            {/* Height */}
                            <div className="flex items-center">
                              <span className="text-gray-300 min-w-[52px]">Height:</span>
                              <span className="text-white font-medium">{diffs.height_diff === 0 ? 'Even' :
                                `${diffs.height_diff > 0 ? A.name : B.name} +${Math.abs(diffs.height_diff)}"`}
                              </span>
                            </div>

                            {/* Reach */}
                            <div className="flex items-center">
                              <span className="text-gray-300 min-w-[52px]">Reach:</span>
                              <span className="text-white font-medium">{diffs.reach_diff === 0 ? 'Even' :
                                `${diffs.reach_diff > 0 ? A.name : B.name} +${Math.abs(diffs.reach_diff)}"`}
                              </span>
                            </div>

                            {/* Age */}
                            <div className="flex items-center">
                              <span className="text-gray-300 min-w-[52px]">Age:</span>
                              <span className="text-white font-medium">{diffs.age_diff === 0 ? 'Even' :
                                `${diffs.age_diff < 0 ? A.name : B.name} ${Math.abs(diffs.age_diff)}yr(s) younger`}
                              </span>
                            </div>
                          </div>

                        </div>

                      </div>

                      {/* Model Interpretation */}
                      <div className="mt-5 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          <span>
                            {penaltyScore > 0.3 ? 'High mismatch detected - significant physical differences' :
                              penaltyScore > 0.15 ? 'Moderate mismatch - notable physical differences' :
                                'Low mismatch - similar physical attributes'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {fight.error && (
                  <div className="mt-4 text-center text-red-500 font-medium">
                    ⚠️ {fight.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

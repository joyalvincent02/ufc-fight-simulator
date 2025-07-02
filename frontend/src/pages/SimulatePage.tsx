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
  probabilities: {
    P_A: number;
    P_B: number;
    P_neutral: number;
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

  useEffect(() => {
    if (!eventId) return;
    simulateEvent(eventId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <Spinner />;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Soft glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-center">Simulated Card: {data.event}</h1>

        <div className="space-y-8">
          {data.fights.map((fight, i) => {
            const [A, B] = fight.fighters;
            const { P_A, P_B, P_neutral } = fight.probabilities;
            const results = fight.results;
            const drawPct = results["Draw"] || 0;

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
                    const winPct = results[f.name] || 0;
                    const otherWinPct = results[[A, B][1 - idx].name] || 0;

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
                          Win %: {results[f.name]?.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-400">
                          Exchange Chance: {((idx === 0 ? P_A : P_B) * 100).toFixed(2)}%
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 text-center text-sm text-gray-300">
                  Neutral Exchanges: {(P_neutral * 100).toFixed(2)}% &nbsp;|&nbsp;
                  Draws: {drawPct.toFixed(1)}%
                </div>

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

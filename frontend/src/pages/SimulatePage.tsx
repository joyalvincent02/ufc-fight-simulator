import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { simulateEvent } from "../services/api";

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

  if (loading) return <div className="p-6 text-lg">Simulating full event...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
        Simulated Card: {data.event}
      </h1>

      <div className="space-y-6">
        {data.fights.map((fight, i) => {
          const [A, B] = fight.fighters;
          const { P_A, P_B, P_neutral } = fight.probabilities;
          const results = fight.results;

          return (
            <div
              key={i}
              className="bg-white rounded-2xl shadow p-4 md:p-6 border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-center mb-4">
                {A.name} vs {B.name}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[A, B].map((f, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <img
                      src={f.image || FALLBACK_IMAGE}
                      alt={f.name}
                      className="w-24 h-24 rounded-full object-cover border mb-2"
                    />
                    <p className="text-lg font-bold">{f.name}</p>
                    <p className="text-sm text-gray-600">
                      Win %: {results[f.name]?.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      Exchange Chance: {((idx === 0 ? P_A : P_B) * 100).toFixed(2)}%
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                Neutral Exchanges: {(P_neutral * 100).toFixed(2)}% | Draws:{" "}
                {results["Draw"]?.toFixed(1)}%
              </div>

              {fight.error && (
                <div className="mt-2 text-center text-red-500">
                  ⚠️ {fight.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

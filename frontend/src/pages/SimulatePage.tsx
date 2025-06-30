import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { simulateEvent } from "../services/api";

type SimFight = {
  fighters: [string, string];
  probabilities: {
    P_A: number;
    P_B: number;
    P_neutral: number;
  };
  results: {
    [fighter: string]: number;
  };
};

type SimData = {
  event: string;
  fights: SimFight[];
};

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
            <div key={i} className="bg-white rounded-2xl shadow p-4 md:p-6">
              <h2 className="text-xl font-semibold text-center mb-4">
                {A} vs {B}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold">{A}</p>
                  <p className="text-sm text-gray-600">Win %: {results[A]?.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">Exchange Chance: {(P_A * 100).toFixed(1)}%</p>
                </div>

                <div className="text-center">
                  <p className="text-lg font-bold">{B}</p>
                  <p className="text-sm text-gray-600">Win %: {results[B]?.toFixed(1)}%</p>
                  <p className="text-sm text-gray-500">Exchange Chance: {(P_B * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                Neutral Exchanges: {(P_neutral * 100).toFixed(1)}% | Draws: {results["Draw"]?.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

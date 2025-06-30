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

  if (loading) return <div className="p-4">Simulating full event...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return null;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Simulation: {data.event}</h1>
      <div className="space-y-6">
        {data.fights.map((fight, i) => {
          const [A, B] = fight.fighters;
          const { P_A, P_B, P_neutral } = fight.probabilities;
          const results = fight.results;

          return (
            <div key={i} className="p-4 rounded bg-gray-100">
              <h2 className="text-lg font-semibold mb-2">
                {A} vs {B}
              </h2>
              <div className="text-sm mb-1">Exchange Probabilities</div>
              <p>{A}: {(P_A * 100).toFixed(1)}%</p>
              <p>{B}: {(P_B * 100).toFixed(1)}%</p>
              <p>Neutral: {(P_neutral * 100).toFixed(1)}%</p>

              <div className="text-sm mt-4 mb-1">Simulation Results</div>
              <p>{A} Wins: {results[A]?.toFixed(1) ?? "N/A"}%</p>
              <p>{B} Wins: {results[B]?.toFixed(1) ?? "N/A"}%</p>
              <p>Draws: {results["Draw"]?.toFixed(1) ?? "N/A"}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { simulateEvent } from "../services/api";

type SimResult = {
  fighters: [string, string];
  probabilities: {
    P_A: number;
    P_B: number;
    P_neutral: number;
  };
  results: {
    [key: string]: number;
  };
};

export default function SimulatePage() {
  const { eventId } = useParams();
  const [data, setData] = useState<SimResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;
    simulateEvent(eventId)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="p-4">Simulating fight...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!data) return null;

  const [fighterA, fighterB] = data.fighters;
  const { P_A, P_B, P_neutral } = data.probabilities;
  const { results } = data;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Simulation: {fighterA} vs {fighterB}</h1>

      <div className="bg-gray-100 rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Exchange Probabilities</h2>
        <p>{fighterA}: {(P_A * 100).toFixed(1)}%</p>
        <p>{fighterB}: {(P_B * 100).toFixed(1)}%</p>
        <p>Neutral: {(P_neutral * 100).toFixed(1)}%</p>
      </div>

      <div className="bg-gray-100 rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Simulation Results</h2>
        <p>{fighterA} Wins: {results[fighterA].toFixed(1)}%</p>
        <p>{fighterB} Wins: {results[fighterB].toFixed(1)}%</p>
        <p>Draws: {results["Draw"].toFixed(1)}%</p>
      </div>
    </div>
  );
}

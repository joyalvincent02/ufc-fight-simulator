const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}

export async function simulateEvent(eventId: string, model: string = "ensemble"): Promise<any> {
  const res = await fetch(`${BASE_URL}/simulate-event/${eventId}?model=${model}`);
  return res.json();
}

export async function simulateCustomFight(fighterA: string, fighterB: string, model: string = "ensemble") {
  const res = await fetch(`${BASE_URL}/simulate-custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fighter_a: fighterA, fighter_b: fighterB, model }),
  });

  if (!res.ok) throw new Error("Failed to simulate custom fight");
  return res.json();
}

export async function getFighters(): Promise<{ name: string; image?: string }[]> {
  const res = await fetch(`${BASE_URL}/fighters`);
  if (!res.ok) throw new Error("Failed to load fighter list");
  return await res.json();
}

export async function getModelPerformance() {
  const res = await fetch(`${BASE_URL}/model-performance`);
  if (!res.ok) throw new Error("Failed to load model performance");
  return res.json();
}

export async function getDetailedPerformance() {
  const res = await fetch(`${BASE_URL}/model-performance/detailed`);
  if (!res.ok) throw new Error("Failed to load detailed performance");
  return res.json();
}

export async function updateFightResult(fighterA: string, fighterB: string, actualWinner: string, event?: string) {
  const res = await fetch(`${BASE_URL}/update-fight-result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      fighter_a: fighterA, 
      fighter_b: fighterB, 
      actual_winner: actualWinner,
      event 
    }),
  });

  if (!res.ok) throw new Error("Failed to update fight result");
  return res.json();
}

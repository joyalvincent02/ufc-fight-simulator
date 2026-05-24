const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function adminHeaders(key: string): Record<string, string> {
  return { "Content-Type": "application/json", "X-Admin-Key": key };
}

export async function getEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  if (!res.ok) throw new Error("Failed to load events");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(data?.error || "Failed to load events");
  return data;
}

export async function getEventCard(eventId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/event-card/${eventId}`);
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

export async function updateFightResult(fighterA: string, fighterB: string, actualWinner: string, adminKey: string, event?: string) {
  const res = await fetch(`${BASE_URL}/update-fight-result`, {
    method: "POST",
    headers: adminHeaders(adminKey),
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

export async function verifyAdminKey(key: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/admin/verify`, {
    method: "POST",
    headers: adminHeaders(key),
  });
  return res.ok;
}

// Scheduler API functions
export async function getSchedulerStatus() {
  const res = await fetch(`${BASE_URL}/scheduler/status`);
  if (!res.ok) throw new Error("Failed to get scheduler status");
  return res.json();
}

export async function manualResultCheck(adminKey: string) {
  const res = await fetch(`${BASE_URL}/scheduler/check-results`, {
    method: "POST",
    headers: adminHeaders(adminKey),
  });
  if (!res.ok) throw new Error("Failed to trigger result check");
  return res.json();
}

export async function manualEventCheck(adminKey: string) {
  const res = await fetch(`${BASE_URL}/scheduler/check-events`, {
    method: "POST",
    headers: adminHeaders(adminKey),
  });
  if (!res.ok) throw new Error("Failed to trigger event check");
  return res.json();
}

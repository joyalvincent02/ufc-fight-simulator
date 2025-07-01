const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getEvents() {
  const res = await fetch(`${BASE_URL}/events`);
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}

export async function simulateEvent(eventId: string) {
  const res = await fetch(`${BASE_URL}/simulate-event/${eventId}`);
  if (!res.ok) throw new Error("Failed to simulate event");
  return res.json();
}

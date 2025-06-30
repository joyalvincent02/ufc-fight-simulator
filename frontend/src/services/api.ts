const BASE_URL = 'http://localhost:8000'; // change if needed

export async function getEvents() {
  const res = await fetch("http://localhost:8000/events");
  if (!res.ok) throw new Error("Failed to load events");
  return res.json();
}

export async function simulateEvent(eventId: string) {
  const res = await fetch(`${BASE_URL}/simulate/${eventId}`);
  if (!res.ok) throw new Error('Failed to simulate event');
  return res.json();
}

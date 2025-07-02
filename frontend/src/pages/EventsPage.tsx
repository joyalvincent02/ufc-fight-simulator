import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../services/api";

type Event = {
  id: string;
  name: string;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 text-center">Upcoming UFC Events</h1>

        <div className="space-y-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white/5 border border-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl flex items-center justify-between shadow hover:shadow-lg transition"
            >
              <span className="text-base sm:text-lg font-medium text-white">{event.name}</span>
              <Link
                to={`/simulate/${event.id}`}
                className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition"
              >
                Simulate
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

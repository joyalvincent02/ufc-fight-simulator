import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../services/api";
import PageLayout from "../components/PageLayout";

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
    <PageLayout title="Upcoming UFC Events">
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
    </PageLayout>
  );
}

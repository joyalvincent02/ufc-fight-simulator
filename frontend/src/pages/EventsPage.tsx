import { useEffect, useState } from 'react';
import { getEvents } from '../services/api';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getEvents()
      .then(setEvents)
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div className="text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Upcoming UFC Events</h1>
      <ul className="space-y-2">
        {events.map(event => (
          <li key={event.id} className="p-4 bg-gray-100 rounded">
            {event.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

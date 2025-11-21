import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../services/api";
import PageLayout from "../components/PageLayout";
import SkeletonLoader from "../components/SkeletonLoader";
import ErrorDisplay from "../components/ErrorDisplay";
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

type Event = {
  id: string;
  name: string;
  status?: "ongoing" | "upcoming";
  event_date?: string | null;
  event_date_display?: string | null;
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <PageLayout title="Upcoming UFC Events">
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className="bg-white/90 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md p-6 rounded-xl flex items-center justify-between"
            >
              <SkeletonLoader variant="text" width="70%" height="24px" />
              <SkeletonLoader variant="rectangular" width="100px" height="40px" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <ErrorDisplay 
          error={error} 
          onRetry={fetchEvents}
          className="mb-6"
        />
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-12">
          <CalendarTodayIcon 
            sx={{ fontSize: 64 }} 
            className="text-gray-400 dark:text-gray-600 mb-4" 
          />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No upcoming events
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Check back later for new UFC events to simulate.
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="space-y-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white/90 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl flex items-center justify-between shadow hover:shadow-lg transition group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <SportsMmaIcon 
                  sx={{ fontSize: 24 }} 
                  className="text-red-500 flex-shrink-0" 
                />
                <div>
                  <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-white block">
                    {event.name}
                  </span>
                  {(event.event_date_display || event.event_date) && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {event.event_date_display ??
                        new Date(
                          event.event_date!.includes("T")
                            ? event.event_date!
                            : `${event.event_date}T12:00:00Z`
                        ).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                    </span>
                  )}
                </div>
              </div>
              <Link
                to={`/simulate/${event.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition group-hover:scale-105"
              >
                <PlayArrowIcon sx={{ fontSize: 18 }} />
                Simulate
              </Link>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}

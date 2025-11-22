import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../services/api";
import PageLayout from "../components/PageLayout";
import SkeletonLoader from "../components/SkeletonLoader";
import ErrorDisplay from "../components/ErrorDisplay";
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';

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

  const ongoingEvents = events.filter(e => e.status === "ongoing");
  const upcomingEvents = events.filter(e => e.status !== "ongoing");

  const renderEventCard = (event: Event) => (
    <div
      key={event.id}
      className={`bg-white/90 dark:bg-white/5 border backdrop-blur-md p-4 sm:p-6 rounded-xl flex items-center justify-between shadow hover:shadow-lg transition group ${
        event.status === "ongoing"
          ? "border-red-500 dark:border-red-500/50"
          : "border-gray-200 dark:border-white/10"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {event.status === "ongoing" ? (
          <SportsMmaIcon 
            sx={{ fontSize: 24 }} 
            className="text-red-500 flex-shrink-0" 
          />
        ) : (
          <SportsMmaIcon 
            sx={{ fontSize: 24 }} 
            className="text-red-500 flex-shrink-0" 
          />
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-medium text-gray-900 dark:text-white block">
              {event.name}
            </span>
            {event.status === "ongoing" && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                LIVE
              </span>
            )}
          </div>
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
  );

  return (
    <PageLayout title="Events">
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
            className=" dark:text-gray-600 mb-4" 
          />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No events
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Check back later for new UFC events to simulate.
          </p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="space-y-8">
          {/* Ongoing Events Section */}
          {ongoingEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <RadioButtonCheckedIcon className="text-red-500 animate-pulse" />
                Ongoing Event
              </h2>
              <div className="space-y-4">
                {ongoingEvents.map(renderEventCard)}
              </div>
            </div>
          )}

          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CalendarTodayIcon className="text-red-500 dark:text-red-500" />
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcomingEvents.map(renderEventCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}

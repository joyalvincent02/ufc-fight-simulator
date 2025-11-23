import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MMA_Math from "../assets/mma_math.svg";
import { getEvents, simulateEvent, getModelPerformance, getFighters } from "../services/api";
import { 
  SportsKabaddiOutlined, 
  PsychologyOutlined, 
  AnalyticsOutlined, 
  FlashOnOutlined,
  SportsMma 
} from "@mui/icons-material";

type NextEvent = {
  id: string;
  name: string;
  status?: string;
  event_date?: string | null;
  event_date_display?: string | null;
};

export default function HomePage() {
  const [nextEvent, setNextEvent] = useState<null | NextEvent>(null);
  const [mainEvent, setMainEvent] = useState<null | {
    name: string;
    fighters: { name: string; image?: string }[];
  }>(null);
  const [loadingMainEvent, setLoadingMainEvent] = useState(true);
  
  // New state for dashboard features
  const [stats, setStats] = useState({
    totalFighters: 0,
    totalPredictions: 0,
    accuracy: 0
  });
  const [loadingPerformance, setLoadingPerformance] = useState(true);

  const formatEventDate = (event: NextEvent | null) => {
    if (!event) return null;
    if (event.event_date_display) return event.event_date_display;
    if (event.event_date) {
      const iso = event.event_date.includes("T")
        ? event.event_date
        : `${event.event_date}T12:00:00Z`;
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    return null;
  };

  useEffect(() => {
    // Load event data
    getEvents().then((events: NextEvent[]) => {
      if (events.length === 0) return;
      // Prioritize ongoing events, otherwise use the first event
      const selectedEvent = events.find((e: NextEvent) => e.status === "ongoing") || events[0];
      setNextEvent(selectedEvent);

      simulateEvent(selectedEvent.id)
        .then((data) => {
          if (data.fights && data.fights.length > 0) {
            setMainEvent({
              name: data.event,
              fighters: data.fights[0].fighters,
            });
          }
        })
        .finally(() => setLoadingMainEvent(false));
    });

    // Load performance data and stats
    Promise.all([
      getModelPerformance(),
      getFighters()
    ]).then(([performance, fighters]) => {
      console.log('Performance data:', performance);
      console.log('Fighters data:', fighters);
      
      // Calculate stats from performance data
      let totalPredictions = 0;
      let accuracy = 0;
      
      if (performance && typeof performance === 'object') {
        // Use the overall stats directly from the API response
        if ('overall_accuracy' in performance) {
          accuracy = performance.overall_accuracy as number;
        }
        
        if ('total_predictions' in performance) {
          totalPredictions = performance.total_predictions as number;
        }
      }
      
      setStats({
        totalFighters: fighters.length,
        totalPredictions: totalPredictions,
        accuracy: Math.round(accuracy)
      });
      
      console.log('Calculated stats:', {
        totalFighters: fighters.length,
        totalPredictions: totalPredictions,
        accuracy: Math.round(accuracy)
      });
    }).catch((error) => {
      console.error('Error loading performance data:', error);
    }).finally(() => {
      setLoadingPerformance(false);
    });
  }, []);

  const nextEventDateDisplay = formatEventDate(nextEvent);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white relative overflow-hidden font-sans">
      {/* Glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-5 dark:opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-5 dark:opacity-10 rounded-full blur-[100px] z-0" />

      <main className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero */}
        <section className="flex flex-col items-center text-center pt-28 pb-20">
          <img src={MMA_Math} alt="MMA Math Logo" className="w-64 h-64 drop-shadow-lg" />
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            MMA Math
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mb-8">
            Simulate UFC fights using real fighter stats and machine-learned logic.
            Built for fans, analysts and anyone curious about what <em>might</em> happen
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/events"
              className="group px-8 py-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              <SportsMma className="text-xl" />
              <div className="text-left">
                <div className="font-bold">Browse Events</div>
                <div className="text-xs opacity-90">Simulate real UFC cards</div>
              </div>
            </Link>
            <Link
              to="/custom"
              className="group px-8 py-4 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              <SportsKabaddiOutlined className="text-xl" />
              <div className="text-left">
                <div className="font-bold">Custom Fight</div>
                <div className="text-xs opacity-75">Pick any two fighters</div>
              </div>
            </Link>
          </div>
        </section>

        {/* Live Performance Dashboard */}
        <section className="py-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Model Performance</h2>
            <p className="text-gray-600 dark:text-gray-300">Real-time model accuracy and platform statistics</p>
          </div>
          
          {loadingPerformance ? (
            <div className="flex justify-center items-center py-8">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full border-2 border-gray-300 dark:border-white/20 animate-spin"></div>
                <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-red-500 animate-spin"></div>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 text-center shadow-lg backdrop-blur-md">
                <div className="text-3xl font-bold text-red-500 dark:text-red-400 mb-2">
                  {stats.accuracy || 0}%
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Model Accuracy</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Across all predictions</div>
              </div>
              
              <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 text-center shadow-lg backdrop-blur-md">
                <div className="text-3xl font-bold text-blue-500 dark:text-blue-400 mb-2">
                  {stats.totalPredictions ? stats.totalPredictions.toLocaleString() : '0'}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Predictions Made</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fight simulations run</div>
              </div>
              
              <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 text-center shadow-lg backdrop-blur-md">
                <div className="text-3xl font-bold text-green-500 dark:text-green-400 mb-2">
                  {stats.totalFighters ? stats.totalFighters.toLocaleString() : '0'}
                </div>
                <div className="text-gray-600 dark:text-gray-300 font-medium">Fighters Tracked</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">UFC roster size</div>
              </div>
            </div>
          )}
        </section>

        {/* Featured Event with Fighters */}
        <section className="text-center py-12">
          <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-lg backdrop-blur-md max-w-xl mx-auto min-h-[240px] flex flex-col justify-center">
            {loadingMainEvent ? (
              <div className="flex justify-center items-center">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-300 dark:border-white/20 animate-spin"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-red-500 animate-spin"></div>
                </div>
              </div>
            ) : mainEvent ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-red-500 dark:text-red-400">
                  {nextEvent?.status === "ongoing" ? "Ongoing Event" : "Next Event"}
                </h2>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{mainEvent.name}</h2>
                {nextEventDateDisplay && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {nextEventDateDisplay}
                  </p>
                )}

                <div className="flex justify-center items-center gap-6 mb-4">
                  {mainEvent.fighters.length >= 2 && (
                    <>
                      <div className="flex flex-col items-center">
                        <img
                          src={mainEvent.fighters[0].image || "https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png"}
                          alt={mainEvent.fighters[0].name}
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-white/20"
                        />
                        <p className="text-gray-900 dark:text-white mt-2 text-sm font-semibold">{mainEvent.fighters[0].name}</p>
                      </div>

                      <span className="text-xl font-bold text-red-500 dark:text-red-400">VS</span>

                      <div className="flex flex-col items-center">
                        <img
                          src={mainEvent.fighters[1].image || "https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png"}
                          alt={mainEvent.fighters[1].name}
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-white/20"
                        />
                        <p className="text-gray-900 dark:text-white mt-2 text-sm font-semibold">{mainEvent.fighters[1].name}</p>
                      </div>
                    </>
                  )}
                </div>

                {nextEvent && (
                  <Link
                    to={`/simulate/${nextEvent.id}`}
                    className="text-red-500 dark:text-red-400 font-medium hover:underline"
                  >
                    Simulate This Card →
                  </Link>
                )}
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-300 text-sm">No event data available.</p>
            )}
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="grid md:grid-cols-3 gap-8 py-16">
          {[
            {
              icon: <PsychologyOutlined className="text-4xl" />,
              title: "Smart Model Switching",
              desc: "Toggle between simulation, machine learning, and ensemble models to explore different prediction strategies and see how they compare.",
            },
            {
              icon: <AnalyticsOutlined className="text-4xl" />,
              title: "Detailed Fight Analytics",
              desc: "Each fight includes mismatch penalties and a breakdown of key physical advantages like reach, height, weight, and age differentials.",
            },
            {
              icon: <FlashOnOutlined className="text-4xl" />,
              title: "Live Stats + Fast Results",
              desc: "Pulls fresh fighter stats from UFCStats.com. Powered by FastAPI, React, and deployed via Azure with automated CI/CD.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-lg shadow hover:shadow-lg transition-all duration-200 text-center group hover:scale-105"
            >
              <div className="mb-4 group-hover:scale-110 transition-transform duration-200 text-gray-700 dark:text-gray-300">{item.icon}</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

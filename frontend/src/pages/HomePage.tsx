import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import MMA_Math from "../assets/mma_math.svg";
import { getEvents, simulateEvent } from "../services/api";

export default function HomePage() {
  const [nextEvent, setNextEvent] = useState<any>(null);
  const [mainEvent, setMainEvent] = useState<null | {
    name: string;
    fighters: { name: string; image?: string }[];
  }>(null);
  const [loadingMainEvent, setLoadingMainEvent] = useState(true);

  useEffect(() => {
    getEvents().then((events) => {
      if (events.length === 0) return;
      const first = events[0];
      setNextEvent(first);

      simulateEvent(first.id)
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
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Glow accents */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <main className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero */}
        <section className="flex flex-col items-center text-center pt-28 pb-20">
          <img src={MMA_Math} alt="MMA Math Logo" className="w-64 h-64 drop-shadow-lg" />
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            MMA Math
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-8">
            Simulate UFC fights using real fighter stats and machine-learned logic.
            Built for fans, analysts and anyone curious about what <em>might happen</em> 🤞
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/events"
              className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 font-semibold transition shadow-md"
            >
              Browse Events
            </Link>
            <Link
              to="/custom"
              className="px-6 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 font-semibold transition shadow-md"
            >
              Custom Simulation
            </Link>
          </div>
        </section>

        {/* Featured Event with Fighters */}
        <section className="text-center py-12">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg backdrop-blur-md max-w-xl mx-auto min-h-[240px] flex flex-col justify-center">
            {loadingMainEvent ? (
              <div className="flex justify-center items-center">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full border-4 border-white/20 animate-spin"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-red-500 animate-spin"></div>
                </div>
              </div>
            ) : mainEvent ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-red-400">Next Event</h2>
                <h2 className="text-xl font-bold mb-4 text-white">{mainEvent.name}</h2>

                <div className="flex justify-center items-center gap-6 mb-4">
                  {mainEvent.fighters.length >= 2 && (
                    <>
                      <div className="flex flex-col items-center">
                        <img
                          src={mainEvent.fighters[0].image || "https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png"}
                          alt={mainEvent.fighters[0].name}
                          className="w-24 h-24 rounded-full object-cover border"
                        />
                        <p className="text-white mt-2 text-sm font-semibold">{mainEvent.fighters[0].name}</p>
                      </div>

                      <span className="text-xl font-bold text-red-400">VS</span>

                      <div className="flex flex-col items-center">
                        <img
                          src={mainEvent.fighters[1].image || "https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png"}
                          alt={mainEvent.fighters[1].name}
                          className="w-24 h-24 rounded-full object-cover border"
                        />
                        <p className="text-white mt-2 text-sm font-semibold">{mainEvent.fighters[1].name}</p>
                      </div>
                    </>
                  )}
                </div>

                {nextEvent && (
                  <Link
                    to={`/simulate/${nextEvent.id}`}
                    className="text-red-400 font-medium hover:underline"
                  >
                    Simulate This Card →
                  </Link>
                )}
              </>
            ) : (
              <p className="text-gray-300 text-sm">No event data available.</p>
            )}
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="grid md:grid-cols-3 gap-8 py-16">
          {[
            {
              title: "Smart Model Switching",
              desc: "Toggle between simulation, machine learning, and ensemble models to explore different prediction strategies.",
            },
            {
              title: "Detailed Fight Analytics",
              desc: "Each fight includes mismatch penalties and a breakdown of key physical advantages like reach, height, weight, and age.",
            },
            {
              title: "Live Stats + Fast Results",
              desc: "Pulls fresh fighter stats from UFCStats.com. Powered by FastAPI, React, and deployed via Azure with CI/CD.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 p-6 rounded-lg shadow hover:shadow-lg transition text-center"
            >
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

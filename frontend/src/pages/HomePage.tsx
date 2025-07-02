import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getEvents } from "../services/api";
import MMA_Math from "../assets/mma_math.svg";

export default function HomePage() {
  const [nextEvent, setNextEvent] = useState<any>(null);

  useEffect(() => {
    getEvents().then((events) => {
      if (events.length > 0) setNextEvent(events[0]);
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Decorative glow */}
      <div className="absolute -top-20 -left-32 w-[500px] h-[500px] bg-red-700 opacity-20 rounded-full blur-[160px] z-0" />
      <div className="absolute bottom-[-80px] right-[-60px] w-[300px] h-[300px] bg-red-500 opacity-10 rounded-full blur-[100px] z-0" />

      <main className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero */}
        <section className="flex flex-col items-center text-center pt-28 pb-20">
            <img src={MMA_Math} alt="MMA Math Logo" className="w-64 h-64 drop-shadow-lg"/>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            MMA Math
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-8">
            Simulate UFC fights using real fighter stats and machine-learned logic. Built for fans, analysts, and anyone curious about what *might happen*.
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

        {/* Featured Event */}
        {nextEvent && (
          <section className="text-center py-12">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-lg backdrop-blur-md max-w-md mx-auto">
              <h2 className="text-xl font-bold mb-2 text-white">Next UFC Event</h2>
              <p className="text-lg text-gray-300 mb-3">{nextEvent.title}</p>
              <Link
                to={`/simulate/${nextEvent.id}`}
                className="text-red-400 font-medium hover:underline"
              >
                Simulate This Card →
              </Link>
            </div>
          </section>
        )}

        {/* Feature Highlights */}
        <section className="grid md:grid-cols-3 gap-8 py-16">
          {[
            {
              title: "Live Fighter Stats",
              desc: "Always current, scraped directly from UFCStats.com to reflect real-world performance.",
            },
            {
              title: "Probability Engine",
              desc: "Built on custom logic and simulation math to predict outcomes fairly.",
            },
            {
              title: "Beautiful & Fast",
              desc: "Built with FastAPI, React, Tailwind CSS, and deployed via Azure with CI/CD.",
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

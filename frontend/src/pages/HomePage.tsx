import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-gray-900 to-black text-white">
      <h1 className="text-4xl sm:text-5xl font-bold text-center mb-6">
        🧠 UFC Fight Simulator
      </h1>
      <p className="text-center text-lg max-w-xl mb-8">
        Predict UFC fight outcomes using real stats and 1000+ simulations per match.
      </p>
      <div className="flex gap-4">
        <Link
          to="/events"
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 font-semibold transition"
        >
          Browse Events
        </Link>
        <Link
          to="/custom"
          className="px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-800 font-semibold transition"
        >
          Custom Simulation
        </Link>
      </div>
    </div>
  );
}

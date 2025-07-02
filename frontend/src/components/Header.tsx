import { Link } from "react-router-dom";
import MMA_Math from "../assets/mma_math.svg";

export default function Header() {
  return (
    <header className="bg-black text-white px-4 py-3 shadow">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <img src={MMA_Math} alt="MMA Math Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
          <span>MMA Math</span>
        </Link>
        <nav className="space-x-4 text-sm">
          <Link to="/events" className="hover:underline">
            Events
          </Link>
          <Link to="/custom" className="hover:underline">
            Custom
          </Link>
          <Link to="/model" className="hover:underline">
            Model
          </Link>
        </nav>
      </div>
    </header>
  );
}

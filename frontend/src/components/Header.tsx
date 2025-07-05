import { Link } from "react-router-dom";
import MMA_Math from "../assets/mma_math.svg";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="bg-white dark:bg-black text-gray-900 dark:text-white shadow-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to="/"
          className="flex items-center gap-3 text-xl sm:text-2xl font-bold tracking-tight hover:opacity-90 transition"
        >
          <img
            src={MMA_Math}
            alt="MMA Math Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-md"
          />
          <span>MMA Math</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <nav className="space-x-4 sm:space-x-6 text-sm sm:text-base font-medium">
            <Link
              to="/events"
              className="text-gray-700 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition"
            >
              Events
            </Link>
            <Link
              to="/custom"
              className="text-gray-700 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition"
            >
              Custom
            </Link>
            <Link
              to="/models"
              className="text-gray-700 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition"
            >
              Models
            </Link>
            <Link
              to="/results"
              className="text-gray-700 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition"
            >
              Results
            </Link>
          </nav>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

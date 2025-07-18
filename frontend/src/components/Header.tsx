import { Link } from "react-router-dom";
import { useState } from "react";
import MMA_Math from "../assets/mma_math.svg";
import ThemeToggle from "./ThemeToggle";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AnalyticsIcon from '@mui/icons-material/Analytics';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white dark:bg-black text-gray-900 dark:text-white shadow-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-3">
        {/* Main header */}
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="flex items-center gap-3 text-xl sm:text-2xl font-bold tracking-tight hover:opacity-90 transition"
            onClick={closeMobileMenu}
          >
            <img
              src={MMA_Math}
              alt="MMA Math Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 drop-shadow-md"
            />
            <span>MMA Math</span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 text-base font-medium">
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
            
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <CloseIcon sx={{ fontSize: 24 }} />
              ) : (
                <MenuIcon sx={{ fontSize: 24 }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2">
              <Link
                to="/events"
                className="flex items-center gap-3 text-gray-700 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={closeMobileMenu}
              >
                <SportsMmaIcon sx={{ fontSize: 24 }} />
                <span>Events</span>
              </Link>
              <Link
                to="/custom"
                className="flex items-center gap-3 text-gray-700 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={closeMobileMenu}
              >
                <SportsKabaddiIcon sx={{ fontSize: 24 }} />
                <span>Custom</span>
              </Link>
              <Link
                to="/models"
                className="flex items-center gap-3 text-gray-700 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={closeMobileMenu}
              >
                <SmartToyIcon sx={{ fontSize: 24 }} />
                <span>Models</span>
              </Link>
              <Link
                to="/results"
                className="flex items-center gap-3 text-gray-700 dark:text-white hover:text-red-500 dark:hover:text-red-400 transition py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={closeMobileMenu}
              >
                <AnalyticsIcon sx={{ fontSize: 24 }} />
                <span>Results</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

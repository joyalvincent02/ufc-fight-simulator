import { useTheme } from '../hooks/useTheme';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

export default function ThemeToggle() {
  const { effectiveTheme, setTheme } = useTheme();

  const handleToggle = () => {
    // Toggle between light and dark modes
    setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <button
      onClick={handleToggle}
      className="relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 bg-gray-200 dark:bg-gray-700"
      title={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Track */}
      <span className="sr-only">Toggle theme</span>
      
      {/* Thumb */}
      <span
        className={`${
          effectiveTheme === 'dark' ? 'translate-x-7' : 'translate-x-0'
        } pointer-events-none inline-flex w-6 h-6 rounded-full bg-white dark:bg-gray-800 shadow-lg transform ring-0 transition duration-200 ease-in-out items-center justify-center`}
      >
        {/* Icon inside the thumb */}
        <span className="text-gray-600 dark:text-gray-300 flex items-center justify-center">
          {effectiveTheme === 'dark' ? (
            <DarkModeOutlinedIcon sx={{ fontSize: 14 }} />
          ) : (
            <LightModeOutlinedIcon sx={{ fontSize: 14 }} />
          )}
        </span>
      </span>
    </button>
  );
}

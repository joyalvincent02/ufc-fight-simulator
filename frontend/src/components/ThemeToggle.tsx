import { useTheme } from '../hooks/useTheme';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';

export default function ThemeToggle() {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const handleToggle = () => {
    // Cycle through: light → dark → system → light
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <SettingsBrightnessIcon sx={{ fontSize: 14 }} />;
    }
    return effectiveTheme === 'dark' ? (
      <DarkModeOutlinedIcon sx={{ fontSize: 14 }} />
    ) : (
      <LightModeOutlinedIcon sx={{ fontSize: 14 }} />
    );
  };

  const getTitle = () => {
    if (theme === 'light') return 'Switch to dark mode';
    if (theme === 'dark') return 'Switch to system preference';
    return 'Switch to light mode';
  };

  return (
    <button
      onClick={handleToggle}
      className="relative inline-flex items-center w-14 h-7 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800 bg-gray-200 dark:bg-gray-700"
      title={getTitle()}
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
          {getIcon()}
        </span>
      </span>
    </button>
  );
}

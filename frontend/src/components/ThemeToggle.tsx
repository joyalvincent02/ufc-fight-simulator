import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, setTheme, effectiveTheme } = useTheme();

  const handleThemeChange = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return '🖥️';
    }
    return effectiveTheme === 'dark' ? '🌙' : '☀️';
  };

  const getThemeLabel = () => {
    if (theme === 'system') {
      return `Auto (${effectiveTheme === 'dark' ? 'Dark' : 'Light'})`;
    }
    return effectiveTheme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <button
      onClick={handleThemeChange}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 dark:bg-white/10 hover:bg-white/20 dark:hover:bg-white/20 transition-colors text-gray-800 dark:text-gray-200"
      title={`Current: ${getThemeLabel()}. Click to cycle: System → Light → Dark`}
    >
      <span className="text-lg">{getThemeIcon()}</span>
      <span className="text-sm font-medium hidden sm:block">{getThemeLabel()}</span>
    </button>
  );
}

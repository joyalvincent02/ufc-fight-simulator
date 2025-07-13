import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface FighterInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  placeholder: string;
  suggestions: { name: string; image?: string }[];
  onSelectSuggestion: (name: string) => void;
  showSuggestions: boolean;
}

export default function FighterInput({
  value,
  onChange,
  onFocus,
  placeholder,
  suggestions,
  onSelectSuggestion,
  showSuggestions
}: FighterInputProps) {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className="flex-1 relative">
      <div className="relative">
        <SearchIcon 
          sx={{ fontSize: 18 }} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Clear input"
          >
            <ClearIcon sx={{ fontSize: 18 }} />
          </button>
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 w-full max-h-48 overflow-auto z-20 shadow-lg">
          {suggestions.map((f, idx) => (
            <li
              key={idx}
              onClick={() => onSelectSuggestion(f.name)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-red-600 cursor-pointer text-sm text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              {f.image && (
                <img 
                  src={f.image} 
                  alt={f.name}
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <span className="flex-1">{f.name}</span>
            </li>
          ))}
        </ul>
      )}
      {showSuggestions && suggestions.length === 0 && value.length > 0 && (
        <div className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 w-full p-4 z-20 shadow-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            No fighters found matching "{value}"
          </p>
        </div>
      )}
    </div>
  );
}

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
  return (
    <div className="flex-1 relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg mt-1 w-full max-h-48 overflow-auto z-20">
          {suggestions.map((f, idx) => (
            <li
              key={idx}
              onClick={() => onSelectSuggestion(f.name)}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-red-600 cursor-pointer text-sm text-gray-900 dark:text-white"
            >
              {f.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

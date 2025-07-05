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
        className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute bg-gray-800 border border-gray-700 rounded-lg mt-1 w-full max-h-48 overflow-auto z-20">
          {suggestions.map((f, idx) => (
            <li
              key={idx}
              onClick={() => onSelectSuggestion(f.name)}
              className="px-4 py-2 hover:bg-red-600 cursor-pointer text-sm"
            >
              {f.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ModelSelectorProps {
  model: string;
  onModelChange: (model: string) => void;
  loading?: boolean;
  disabled?: boolean;
  showLoadingIndicator?: boolean;
}

export default function ModelSelector({ 
  model, 
  onModelChange, 
  loading = false, 
  disabled = false,
  showLoadingIndicator = false 
}: ModelSelectorProps) {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center gap-4 bg-white/90 dark:bg-white/5 px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10">
        <label htmlFor="model" className="text-gray-900 dark:text-white font-medium whitespace-nowrap">
          Prediction Model
        </label>
        <select
          id="model"
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={loading || disabled}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
        >
          <option value="ensemble">Ensemble</option>
          <option value="ml">Machine Learning</option>
          <option value="sim">Simulation</option>
        </select>
        {loading && showLoadingIndicator && (
          <span className="text-yellow-600 dark:text-yellow-400 text-sm ml-2">
            ⟳ Updating...
          </span>
        )}
      </div>
    </div>
  );
}

interface ModelAnalysisProps {
  model: string;
  penaltyScore: number;
  diffs: {
    weight_diff: number;
    height_diff: number;
    reach_diff: number;
    age_diff: number;
  };
  fighterA: string;
  fighterB: string;
}

export default function ModelAnalysis({ 
  model, 
  penaltyScore, 
  diffs, 
  fighterA, 
  fighterB 
}: ModelAnalysisProps) {
  const getInterpretation = (penalty: number) => {
    if (penalty > 0.3) return 'High mismatch detected - significant physical differences';
    if (penalty > 0.15) return 'Moderate mismatch - notable physical differences';
    return 'Low mismatch - similar physical attributes';
  };

  const getAdvantage = (diff: number, category: string) => {
    if (diff === 0) return 'Even';
    const fighter = diff > 0 ? fighterA : fighterB;
    const value = Math.abs(diff);
    
    switch (category) {
      case 'weight':
        return `${fighter} +${value}lbs`;
      case 'height':
      case 'reach':
        return `${fighter} +${value}"`;
      case 'age':
        return `${fighter} ${value}yrs younger`;
      default:
        return 'Even';
    }
  };

  return (
    <div className="mt-6">
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg border border-blue-500/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <h3 className="font-semibold text-blue-300">
            {model === 'ml' ? 'ML Model Analysis' : 'Ensemble Model Analysis'}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* Penalty Score */}
          <div className="bg-black/20 p-3 rounded-lg border border-white/10">
            <div className="text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Mismatch Penalty</p>
              <p className="text-2xl font-bold text-yellow-400">{(penaltyScore * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Physical Advantages */}
          <div className="bg-black/20 p-3 rounded-lg border border-white/10 md:col-span-2">
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Physical Advantages</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Weight:</span>
                <span className="text-white font-medium">
                  {getAdvantage(diffs.weight_diff, 'weight')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Height:</span>
                <span className="text-white font-medium">
                  {getAdvantage(diffs.height_diff, 'height')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Reach:</span>
                <span className="text-white font-medium">
                  {getAdvantage(diffs.reach_diff, 'reach')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Age:</span>
                <span className="text-white font-medium">
                  {getAdvantage(-diffs.age_diff, 'age')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Interpretation */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <span>{getInterpretation(penaltyScore)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

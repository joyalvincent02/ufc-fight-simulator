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

    return (
        <div className="mt-6">
            <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 p-4 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <h3 className="font-semibold text-blue-300">
                        {model === 'ml' ? 'ML Model Analysis' : 'Ensemble Model Analysis'}
                    </h3>
                </div>

                <div className="flex flex-col md:flex-row gap-4 text-sm">
                    {/* Mismatch Penalty */}
                    <div className="flex-1 bg-black/20 p-4 rounded-lg border border-white/10 flex flex-col justify-center items-center text-center">
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Mismatch Penalty</p>
                        <p className="text-3xl font-bold text-yellow-400">{(penaltyScore * 100).toFixed(1)}%</p>
                    </div>

                    {/* Physical Advantages */}
                    <div className="flex-[2] bg-black/20 p-4 rounded-lg border border-white/10">
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">Physical Advantages</p>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-xs">
                            <div className="flex items-center">
                                <span className="text-gray-300 min-w-[52px]">Weight:</span>
                                <span className="text-white font-medium">{diffs.weight_diff === 0 ? 'Even' : `${diffs.weight_diff > 0 ? fighterA : fighterB} +${Math.abs(diffs.weight_diff)}lbs`}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-300 min-w-[52px]">Height:</span>
                                <span className="text-white font-medium">{diffs.height_diff === 0 ? 'Even' : `${diffs.height_diff > 0 ? fighterA : fighterB} +${Math.abs(diffs.height_diff)}"`}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-300 min-w-[52px]">Reach:</span>
                                <span className="text-white font-medium">{diffs.reach_diff === 0 ? 'Even' : `${diffs.reach_diff > 0 ? fighterA : fighterB} +${Math.abs(diffs.reach_diff)}"`}</span>
                            </div>
                            <div className="flex items-center">
                                <span className="text-gray-300 min-w-[52px]">Age:</span>
                                <span className="text-white font-medium">{diffs.age_diff === 0 ? 'Even' : `${diffs.age_diff < 0 ? fighterA : fighterB} ${Math.abs(diffs.age_diff)}yr(s) younger`}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Model Interpretation */}
                <div className="mt-5 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>{getInterpretation(penaltyScore)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

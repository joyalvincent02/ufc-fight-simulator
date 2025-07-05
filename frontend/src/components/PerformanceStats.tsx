interface PerformanceStatsProps {
    stats: {
        overall_accuracy: number;
        total_predictions: number;
        predictions_with_results: number;
        correct_predictions: number;
        model_breakdown: {
            ml: {
                total: number;
                total_with_results: number;
                correct: number;
                accuracy: number;
            };
            ensemble: {
                total: number;
                total_with_results: number;
                correct: number;
                accuracy: number;
            };
            sim: {
                total: number;
                total_with_results: number;
                correct: number;
                accuracy: number;
            };
        };
    };
}

export default function PerformanceStats({ stats }: PerformanceStatsProps) {
    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 70) return "text-green-600 dark:text-green-400";
        if (accuracy >= 60) return "text-yellow-600 dark:text-yellow-400";
        return "text-red-600 dark:text-red-400";
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* ML Model */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-6 rounded-xl border border-purple-200 dark:border-purple-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-purple-500 dark:bg-purple-400 rounded-full"></div>
                        <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300">ML Model</h3>
                    </div>
                    <div className={`text-3xl font-bold ${getAccuracyColor(stats.model_breakdown.ml.accuracy)}`}>
                        {stats.model_breakdown.ml.accuracy.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stats.model_breakdown.ml.correct} of {stats.model_breakdown.ml.total_with_results} correct
                    </p>
                </div>

                {/* Ensemble Model */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 p-6 rounded-xl border border-orange-200 dark:border-orange-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-500 dark:bg-orange-400 rounded-full"></div>
                        <h3 className="text-sm font-medium text-orange-700 dark:text-orange-300">Ensemble Model</h3>
                    </div>
                    <div className={`text-3xl font-bold ${getAccuracyColor(stats.model_breakdown.ensemble.accuracy)}`}>
                        {stats.model_breakdown.ensemble.accuracy.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stats.model_breakdown.ensemble.correct} of {stats.model_breakdown.ensemble.total_with_results} correct
                    </p>
                </div>

                {/* Simulation Model */}
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 p-6 rounded-xl border border-cyan-200 dark:border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full"></div>
                        <h3 className="text-sm font-medium text-cyan-700 dark:text-cyan-300">Simulation Model</h3>
                    </div>
                    <div className={`text-3xl font-bold ${getAccuracyColor(stats.model_breakdown.sim.accuracy)}`}>
                        {stats.model_breakdown.sim.accuracy.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stats.model_breakdown.sim.correct} of {stats.model_breakdown.sim.total_with_results} correct
                    </p>
                </div>
            </div>

            {/* Second Row - Model Summary and Total Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Total Predictions Summary */}
                <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/30 dark:to-blue-900/30 p-6 rounded-xl border border-green-200 dark:border-green-500/30">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                        <h3 className="text-sm font-medium text-green-700 dark:text-green-300">Total Predictions</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {stats.total_predictions}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Predictions</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {stats.predictions_with_results}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">With Results</div>
                        </div>
                    </div>
                </div>

                {/* Model Comparison Summary */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 p-6 rounded-xl border border-gray-200 dark:border-gray-500/30">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full"></div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Model Summary</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {stats.model_breakdown.ml.total}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ML Predictions</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                                {stats.model_breakdown.ensemble.total}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Ensemble Predictions</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                                {stats.model_breakdown.sim.total}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Simulation Predictions</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

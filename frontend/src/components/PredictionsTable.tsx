import { useState } from "react";

interface Prediction {
    id: number;
    fighter_a: string;
    fighter_b: string;
    model: string;
    predicted_winner: string;
    actual_winner: string | null;
    correct: boolean | null;
    fighter_a_prob: number | null;
    fighter_b_prob: number | null;
    penalty_score: number | null;
    timestamp: string | null;
    has_result: boolean;
}

interface PredictionsTableProps {
    predictions: Prediction[];
    onUpdateResult?: (prediction: Prediction) => void;
}

export default function PredictionsTable({ predictions, onUpdateResult }: PredictionsTableProps) {
    const [filter, setFilter] = useState<'all' | 'with_results' | 'pending'>('all');
    const [modelFilter, setModelFilter] = useState<'all' | 'ml' | 'ensemble' | 'sim'>('all');

    const filteredPredictions = predictions.filter(pred => {
        const matchesFilter = filter === 'all' || 
            (filter === 'with_results' && pred.has_result) ||
            (filter === 'pending' && !pred.has_result);
        
        const matchesModel = modelFilter === 'all' || pred.model === modelFilter;
        
        return matchesFilter && matchesModel;
    });

    const getModelBadge = (model: string) => {
        const colors = {
            ml: "bg-purple-900/30 text-purple-300 border-purple-500/30",
            ensemble: "bg-orange-900/30 text-orange-300 border-orange-500/30",
            sim: "bg-cyan-900/30 text-cyan-300 border-cyan-500/30"
        };
        return colors[model as keyof typeof colors] || "bg-gray-900/30 text-gray-300 border-gray-500/30";
    };

    const getResultBadge = (correct: boolean | null, hasResult: boolean) => {
        if (!hasResult) return "bg-gray-900/30 text-gray-300 border-gray-500/30";
        if (correct === true) return "bg-green-900/30 text-green-300 border-green-500/30";
        if (correct === false) return "bg-red-900/30 text-red-300 border-red-500/30";
        return "bg-gray-900/30 text-gray-300 border-gray-500/30";
    };

    const formatDate = (timestamp: string | null) => {
        if (!timestamp) return "Unknown";
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-black/20 rounded-xl border border-white/10 overflow-hidden">
            {/* Filters */}
            <div className="p-4 border-b border-white/10 flex flex-wrap gap-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            filter === 'all' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        All ({predictions.length})
                    </button>
                    <button
                        onClick={() => setFilter('with_results')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            filter === 'with_results' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        With Results ({predictions.filter(p => p.has_result).length})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            filter === 'pending' 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        Pending ({predictions.filter(p => !p.has_result).length})
                    </button>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={() => setModelFilter('all')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            modelFilter === 'all' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        All Models
                    </button>
                    <button
                        onClick={() => setModelFilter('ml')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            modelFilter === 'ml' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        ML Only
                    </button>
                    <button
                        onClick={() => setModelFilter('ensemble')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            modelFilter === 'ensemble' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        Ensemble Only
                    </button>
                    <button
                        onClick={() => setModelFilter('sim')}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                            modelFilter === 'sim' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                    >
                        Simulation Only
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="text-left p-4 text-sm font-medium text-gray-300">Fight</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-300">Model</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-300">Predicted</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-300">Confidence</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-300">Actual</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-300">Result</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-300">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPredictions.map((prediction) => (
                            <tr key={prediction.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4">
                                    <div className="text-sm font-medium text-white">
                                        {prediction.fighter_a} vs {prediction.fighter_b}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getModelBadge(prediction.model)}`}>
                                        {prediction.model.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-white font-medium">
                                        {prediction.predicted_winner}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-300">
                                        {prediction.fighter_a_prob && prediction.fighter_b_prob 
                                            ? `${Math.max(prediction.fighter_a_prob, prediction.fighter_b_prob).toFixed(1)}%`
                                            : 'N/A'
                                        }
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-300">
                                        {prediction.actual_winner || 'Pending'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getResultBadge(prediction.correct, prediction.has_result)}`}>
                                        {!prediction.has_result ? 'Pending' : 
                                         prediction.correct ? 'Correct' : 'Incorrect'}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-400">
                                        {formatDate(prediction.timestamp)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredPredictions.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                    No predictions found matching the selected filters.
                </div>
            )}
        </div>
    );
}

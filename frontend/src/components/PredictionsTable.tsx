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
}

export default function PredictionsTable({ predictions }: PredictionsTableProps) {
    const [filter, setFilter] = useState<'all' | 'with_results' | 'pending'>('all');
    const [modelFilter, setModelFilter] = useState<'all' | 'ml' | 'ensemble' | 'sim'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const filteredPredictions = predictions.filter(pred => {
        const matchesFilter = filter === 'all' || 
            (filter === 'with_results' && pred.has_result) ||
            (filter === 'pending' && !pred.has_result);
        
        const matchesModel = modelFilter === 'all' || pred.model === modelFilter;
        
        const matchesSearch = searchTerm === '' || 
            pred.fighter_a.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pred.fighter_b.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pred.predicted_winner.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (pred.actual_winner && pred.actual_winner.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesFilter && matchesModel && matchesSearch;
    }).sort((a, b) => {
        // First sort by fight name (to group same fights together)
        const fightA = `${a.fighter_a} vs ${a.fighter_b}`;
        const fightB = `${b.fighter_a} vs ${b.fighter_b}`;
        
        if (fightA !== fightB) {
            // For different fights, sort by timestamp (most recent first)
            const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return dateB - dateA;
        }
        
        // For the same fight, sort by model in the order: ensemble, ml, sim
        const modelOrder: { [key: string]: number } = { ensemble: 1, ml: 2, sim: 3 };
        const orderA = modelOrder[a.model.toLowerCase()] || 4;
        const orderB = modelOrder[b.model.toLowerCase()] || 4;
        
        return orderA - orderB;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredPredictions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedPredictions = filteredPredictions.slice(startIndex, endIndex);

    // Reset to first page when filters change
    const resetToFirstPage = () => {
        setCurrentPage(1);
    };

    const getModelBadge = (model: string) => {
        const colors = {
            ml: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-500/30",
            ensemble: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-500/30",
            sim: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/30"
        };
        return colors[model as keyof typeof colors] || "bg-gray-200 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500/30";
    };

    const getResultBadge = (correct: boolean | null, hasResult: boolean) => {
        if (!hasResult) return "bg-gray-200 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500/30";
        if (correct === true) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-500/30";
        if (correct === false) return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-500/30";
        return "bg-gray-200 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-500/30";
    };

    const formatDate = (timestamp: string | null) => {
        if (!timestamp) return "Unknown";
        return new Date(timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
    };

    return (
        <div className="bg-white/80 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Search and Controls */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10">
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    {/* Search Input */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search fighters, winners, or predictions..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    resetToFirstPage();
                                }}
                                className="w-full px-4 py-2 pl-10 bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <div className="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">
                                🔍
                            </div>
                        </div>
                    </div>

                    {/* Items per page */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Show:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                resetToFirstPage();
                            }}
                            className="px-3 py-2 bg-white/90 dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="text-sm text-gray-700 dark:text-gray-300">per page</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setFilter('all');
                                resetToFirstPage();
                            }}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                filter === 'all' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                            }`}
                        >
                            All ({predictions.length})
                        </button>
                        <button
                            onClick={() => {
                                setFilter('with_results');
                                resetToFirstPage();
                            }}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                filter === 'with_results' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                            }`}
                        >
                            With Results ({predictions.filter(p => p.has_result).length})
                        </button>
                        <button
                            onClick={() => {
                                setFilter('pending');
                                resetToFirstPage();
                            }}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                filter === 'pending' 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                            }`}
                        >
                            Pending ({predictions.filter(p => !p.has_result).length})
                        </button>
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setModelFilter('all');
                                resetToFirstPage();
                            }}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                modelFilter === 'all' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                            }`}
                        >
                            All Models
                        </button>
                        <button
                            onClick={() => {
                                setModelFilter('ml');
                                resetToFirstPage();
                            }}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                modelFilter === 'ml' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                            }`}
                        >
                            ML Only
                        </button>
                        <button
                            onClick={() => {
                                setModelFilter('ensemble');
                                resetToFirstPage();
                            }}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                modelFilter === 'ensemble' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                            }`}
                        >
                            Ensemble Only
                        </button>
                        <button
                            onClick={() => {
                                setModelFilter('sim');
                                resetToFirstPage();
                            }}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                modelFilter === 'sim' 
                                    ? 'bg-purple-600 text-white' 
                                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                            }`}
                        >
                            Simulation Only
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-white/5">
                            <th className="text-left p-4 text-sm font-medium text-gray-700 dark:text-gray-300">Fight</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-700 dark:text-gray-300">Model</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-700 dark:text-gray-300">Predicted</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-700 dark:text-gray-300">Confidence</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actual</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-700 dark:text-gray-300">Result</th>
                            <th className="text-left p-4 text-sm font-medium text-gray-700 dark:text-gray-300">Predicted On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedPredictions.map((prediction) => (
                            <tr key={prediction.id} className="border-b border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                                <td className="p-4">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {prediction.fighter_a} vs {prediction.fighter_b}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getModelBadge(prediction.model)}`}>
                                        {prediction.model.toUpperCase()}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                                        {prediction.predicted_winner}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        {prediction.fighter_a_prob && prediction.fighter_b_prob 
                                            ? `${Math.max(prediction.fighter_a_prob, prediction.fighter_b_prob).toFixed(1)}%`
                                            : 'N/A'
                                        }
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
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
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        {formatDate(prediction.timestamp)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {filteredPredictions.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-white/10">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* Results Info */}
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Showing {startIndex + 1} to {Math.min(endIndex, filteredPredictions.length)} of {filteredPredictions.length} results
                            {searchTerm && ` for "${searchTerm}"`}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded-lg text-sm bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    First
                                </button>
                                <button
                                    onClick={() => setCurrentPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 rounded-lg text-sm bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Previous
                                </button>
                                
                                {/* Page Numbers */}
                                <div className="flex gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                                    currentPage === pageNum
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded-lg text-sm bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Next
                                </button>
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 rounded-lg text-sm bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Last
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredPredictions.length === 0 && (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                    {searchTerm ? 
                        `No predictions found matching "${searchTerm}".` :
                        "No predictions found matching the selected filters."
                    }
                </div>
            )}
        </div>
    );
}

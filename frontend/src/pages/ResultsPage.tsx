import { useState, useEffect } from "react";
import { getModelPerformance, getDetailedPerformance } from "../services/api";
import PerformanceStats from "../components/PerformanceStats";
import PredictionsTable from "../components/PredictionsTable";
import SchedulerStatus from "../components/SchedulerStatus";
import PageLayout from "../components/PageLayout";
import Spinner from "../components/Spinner";
import Tooltip from "../components/Tooltip";
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BarChartIcon from '@mui/icons-material/BarChart';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TableChartIcon from '@mui/icons-material/TableChart';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

interface ModelPerformance {
    overall_accuracy: number;
    total_predictions: number;
    predictions_with_results: number;
    correct_predictions: number;
    recent_accuracy: number;
    recent_predictions_count: number;
    best_model: string;
    best_model_accuracy: number;
    avg_confidence: number;
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
}

interface DetailedPerformance {
    predictions: Array<{
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
    }>;
    total_count: number;
}

export default function ResultsPage() {
    const [performance, setPerformance] = useState<ModelPerformance | null>(null);
    const [detailedData, setDetailedData] = useState<DetailedPerformance | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (showRefreshing = false) => {
        try {
            if (showRefreshing) setRefreshing(true);
            else setLoading(true);
            
            const [performanceData, detailedData] = await Promise.all([
                getModelPerformance(),
                getDetailedPerformance()
            ]);
            
            setPerformance(performanceData);
            setDetailedData(detailedData);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        fetchData(true);
    };

    if (loading) {
        return (
            <PageLayout title="Model Performance Results">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Spinner />
                </div>
            </PageLayout>
        );
    }

    if (error) {
        return (
            <PageLayout title="Model Performance Results">
                <div className="text-center py-12">
                    <div className="text-red-600 dark:text-red-400 mb-4 flex items-center justify-center gap-2">
                        <ErrorOutlineIcon />
                        Error loading results
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Model Performance Results">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div className="flex-1">
                        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                            Track accuracy and performance of ML, Ensemble, and Simulation prediction models
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 self-start sm:self-auto"
                    >
                        {refreshing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Refreshing...
                            </>
                        ) : (
                            <>
                                <RefreshOutlinedIcon sx={{ fontSize: 20 }} />
                                Refresh
                            </>
                        )}
                    </button>
                </div>

                {/* Performance Stats */}
                {performance && (
                    <PerformanceStats stats={performance} />
                )}

                {/* Scheduler Status */}
                <div className="mb-8">
                    <SchedulerStatus />
                </div>

                {/* Model Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/80 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <BarChartIcon />
                            Model Comparison
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-purple-600 dark:text-purple-300">ML Model</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 dark:bg-white/10 rounded-full h-2">
                                        <div 
                                            className="bg-purple-500 h-2 rounded-full"
                                            style={{ width: `${performance?.model_breakdown.ml.accuracy || 0}%` }}
                                        />
                                    </div>
                                    <Tooltip content={`${performance?.model_breakdown.ml.correct || 0}/${performance?.model_breakdown.ml.total_with_results || 0} correct\n${performance?.model_breakdown.ml.total || 0} total predictions\n${(performance?.model_breakdown.ml.total || 0) - (performance?.model_breakdown.ml.total_with_results || 0)} pending results`}>
                                        <span className="text-gray-900 dark:text-white font-medium w-12 cursor-help">
                                            {performance?.model_breakdown.ml.accuracy.toFixed(1)}%
                                        </span>
                                    </Tooltip>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-orange-600 dark:text-orange-300">Ensemble Model</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 dark:bg-white/10 rounded-full h-2">
                                        <div 
                                            className="bg-orange-500 h-2 rounded-full"
                                            style={{ width: `${performance?.model_breakdown.ensemble.accuracy || 0}%` }}
                                        />
                                    </div>
                                    <Tooltip content={`${performance?.model_breakdown.ensemble.correct || 0}/${performance?.model_breakdown.ensemble.total_with_results || 0} correct\n${performance?.model_breakdown.ensemble.total || 0} total predictions\n${(performance?.model_breakdown.ensemble.total || 0) - (performance?.model_breakdown.ensemble.total_with_results || 0)} pending results`}>
                                        <span className="text-gray-900 dark:text-white font-medium w-12 cursor-help">
                                            {performance?.model_breakdown.ensemble.accuracy.toFixed(1)}%
                                        </span>
                                    </Tooltip>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-cyan-600 dark:text-cyan-300">Simulation Model</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 dark:bg-white/10 rounded-full h-2">
                                        <div 
                                            className="bg-cyan-500 h-2 rounded-full"
                                            style={{ width: `${performance?.model_breakdown.sim.accuracy || 0}%` }}
                                        />
                                    </div>
                                    <Tooltip content={`${performance?.model_breakdown.sim.correct || 0}/${performance?.model_breakdown.sim.total_with_results || 0} correct\n${performance?.model_breakdown.sim.total || 0} total predictions\n${(performance?.model_breakdown.sim.total || 0) - (performance?.model_breakdown.sim.total_with_results || 0)} pending results`}>
                                        <span className="text-gray-900 dark:text-white font-medium w-12 cursor-help">
                                            {performance?.model_breakdown.sim.accuracy.toFixed(1)}%
                                        </span>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/80 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <GpsFixedIcon />
                            Quick Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                    {performance?.total_predictions || 0}
                                </div>
                                <Tooltip content={`Total predictions made by all models.\n\nSample size: ${performance?.total_predictions && performance.total_predictions > 500 ? 'Substantial' : performance?.total_predictions && performance.total_predictions > 100 ? 'Good' : 'Limited'}\nMore predictions = better statistical confidence`}>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Predictions</div>
                                </Tooltip>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {performance?.overall_accuracy || 0}%
                                </div>
                                <Tooltip content={`Overall accuracy across all completed predictions.\n\nStatus: ${performance?.overall_accuracy && performance.overall_accuracy >= 70 ? 'Excellent performance' : performance?.overall_accuracy && performance.overall_accuracy >= 60 ? 'Good performance' : performance?.overall_accuracy && performance.overall_accuracy >= 50 ? 'Baseline (random chance)' : 'Below baseline'}\n${performance?.overall_accuracy && performance.overall_accuracy < 60 ? 'Room for model improvements' : 'Strong predictive capability'}`}>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Overall Accuracy</div>
                                </Tooltip>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {performance?.recent_accuracy || 0}%
                                </div>
                                <Tooltip content={`Recent performance from last ${performance?.recent_predictions_count || 0} predictions.\n\nTrend: ${performance?.recent_accuracy && performance?.overall_accuracy ? Math.abs(performance.recent_accuracy - performance.overall_accuracy) < 5 ? 'Stable performance' : performance.recent_accuracy < performance.overall_accuracy ? `${Math.round(performance.overall_accuracy - performance.recent_accuracy)}% below average` : `${Math.round(performance.recent_accuracy - performance.overall_accuracy)}% above average` : 'Tracking trends...'}\n${performance?.recent_accuracy && performance?.overall_accuracy && performance.recent_accuracy < performance.overall_accuracy - 10 ? 'May need model retraining' : performance?.recent_accuracy && performance?.overall_accuracy && performance.recent_accuracy > performance.overall_accuracy + 10 ? 'Models improving!' : 'Performance is stable'}`}>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Recent Form ({performance?.recent_predictions_count || 0})
                                    </div>
                                </Tooltip>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                    {performance?.avg_confidence || 0}%
                                </div>
                                <Tooltip content={`Average confidence in predictions.\n\nConfidence level: ${performance?.avg_confidence && performance.avg_confidence >= 80 ? 'Very high' : performance?.avg_confidence && performance.avg_confidence >= 70 ? 'High' : performance?.avg_confidence && performance.avg_confidence >= 60 ? 'Reasonable' : performance?.avg_confidence && performance.avg_confidence >= 50 ? 'Moderate' : 'Low'}\n${performance?.avg_confidence && performance?.overall_accuracy ? Math.abs(performance.avg_confidence - performance.overall_accuracy) > 20 ? `${performance.avg_confidence > performance.overall_accuracy ? 'Overconfident' : 'Underconfident'} by ${Math.round(Math.abs(performance.avg_confidence - performance.overall_accuracy))}%` : 'Well calibrated' : 'Tracking calibration...'}`}>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</div>
                                </Tooltip>
                            </div>
                        </div>
                        {performance?.best_model && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 text-center">
                                <Tooltip content={`${performance.best_model.toUpperCase()} is the top performer.\n\n${performance.best_model_accuracy > performance.overall_accuracy + 10 ? 'Significantly outperforming' : performance.best_model_accuracy > performance.overall_accuracy + 5 ? 'Clearly outperforming' : performance.best_model_accuracy > performance.overall_accuracy ? 'Slightly outperforming' : 'Similar performance'}\n${performance.best_model_accuracy > performance.overall_accuracy ? `+${Math.round(performance.best_model_accuracy - performance.overall_accuracy)}% vs overall average` : 'Consistent with average'}\n${performance.best_model_accuracy >= 70 ? 'Excellent accuracy' : performance.best_model_accuracy >= 60 ? 'Solid accuracy' : 'Room for improvement'}`}>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Best Model: <span className="font-medium text-gray-900 dark:text-white capitalize">
                                            {performance.best_model}
                                        </span> ({performance.best_model_accuracy}%)
                                    </div>
                                </Tooltip>
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Predictions Table */}
                <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <TableChartIcon />
                        Detailed Predictions
                    </h3>
                    {detailedData && (
                        <PredictionsTable predictions={detailedData.predictions} />
                    )}
                </div>

                {/* Info Section */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-500/30 p-6">
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
                        <InfoOutlinedIcon />
                        About Model Performance Tracking
                    </h3>
                    <div className="text-gray-700 dark:text-gray-300 space-y-2">
                        <p>
                            • <strong>Predictions are logged automatically</strong> when using ML or Ensemble models
                        </p>
                        <p>
                            • <strong>Results are updated</strong> when fight outcomes are scraped or manually entered
                        </p>
                        <p>
                            • <strong>Accuracy is calculated</strong> based on correct predictions vs total predictions with results
                        </p>
                        <p>
                            • <strong>Pending predictions</strong> are awaiting fight results to determine accuracy
                        </p>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

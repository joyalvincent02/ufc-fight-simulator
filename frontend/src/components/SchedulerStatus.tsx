import { useState, useEffect } from "react";
import { getSchedulerStatus, manualResultCheck, manualEventCheck } from "../services/api";

interface Job {
    id: string;
    name: string;
    next_run: string | null;
    trigger: string;
}

interface SchedulerStatus {
    running: boolean;
    jobs: Job[];
    last_event_check: string | null;
    last_profile_update: string | null;
    last_result_check: string | null;
    last_cleanup: string | null;
}

export default function SchedulerStatus() {
    const [status, setStatus] = useState<SchedulerStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState({ results: false, events: false });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        fetchStatus();
        // Refresh status every minute
        const interval = setInterval(fetchStatus, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchStatus = async () => {
        try {
            const data = await getSchedulerStatus();
            setStatus(data);
        } catch (error) {
            console.error("Failed to fetch scheduler status:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (isoString: string | null) => {
        if (!isoString) return "Never";
        return new Date(isoString).toLocaleString('en-AU', {
            timeZone: 'Australia/Sydney',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatNextRun = (isoString: string | null) => {
        if (!isoString) return "Not scheduled";
        const date = new Date(isoString);
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        
        if (diff < 0) return "Overdue";
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handleManualResultCheck = async () => {
        setChecking(prev => ({ ...prev, results: true }));
        setMessage(null);
        
        try {
            const result = await manualResultCheck();
            setMessage({ 
                type: 'success', 
                text: `Result check completed. ${result.pending_predictions || 0} predictions awaiting results.` 
            });
            fetchStatus(); // Refresh status
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to check results' });
        } finally {
            setChecking(prev => ({ ...prev, results: false }));
        }
    };

    const handleManualEventCheck = async () => {
        setChecking(prev => ({ ...prev, events: true }));
        setMessage(null);
        
        try {
            const result = await manualEventCheck();
            setMessage({ type: 'success', text: result.message || 'Event check completed successfully' });
            fetchStatus(); // Refresh status to get updated timestamps
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to check events' });
        } finally {
            setChecking(prev => ({ ...prev, events: false }));
        }
    };

    if (loading) {
        return (
            <div className="bg-white/80 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600 dark:text-gray-300">Loading scheduler status...</span>
                </div>
            </div>
        );
    }

    if (!status) {
        return (
            <div className="bg-white/80 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 p-6">
                <p className="text-red-500 dark:text-red-400">Failed to load scheduler status</p>
            </div>
        );
    }

    return (
        <div className="bg-white/80 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Header */}
            <div 
                className="p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Scheduler Status</h3>
                            <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 px-2 sm:px-3 py-1 rounded-lg text-xs font-medium ${
                            status.running 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30'
                        }`}>
                            <div className={`w-2 h-2 rounded-full ${status.running ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            {status.running ? 'Running' : 'Stopped'}
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleManualResultCheck();
                            }}
                            disabled={checking.results}
                            className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {checking.results && <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            <span>Check Results</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleManualEventCheck();
                            }}
                            disabled={checking.events}
                            className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {checking.events && <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            <span>Check Events</span>
                        </button>
                    </div>
                </div>
                
                {message && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${
                        message.type === 'success' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30'
                    }`}>
                        {message.text}
                    </div>
                )}
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Scheduled Jobs */}
                    <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Scheduled Jobs</h4>
                        <div className="space-y-3">
                            {status.jobs.map((job) => (
                                <div key={job.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-white/90 dark:bg-white/5 rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{job.name}</div>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <div className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Next run: {formatNextRun(job.next_run)}
                                        </div>
                                        {job.next_run && (
                                            <div className="text-xs text-gray-600 dark:text-gray-500">
                                                {formatDateTime(job.next_run)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Last Update Times */}
                    <div>
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Last Updates</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 bg-white/90 dark:bg-white/5 rounded-lg">
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Event Check</div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                    {formatDateTime(status.last_event_check)}
                                </div>
                            </div>
                            <div className="p-3 sm:p-4 bg-white/90 dark:bg-white/5 rounded-lg">
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Profile Update</div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                    {formatDateTime(status.last_profile_update)}
                                </div>
                            </div>
                            <div className="p-3 sm:p-4 bg-white/90 dark:bg-white/5 rounded-lg">
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Result Check</div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                    {formatDateTime(status.last_result_check)}
                                </div>
                            </div>
                            <div className="p-3 sm:p-4 bg-white/90 dark:bg-white/5 rounded-lg">
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Database Cleanup</div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                    {formatDateTime(status.last_cleanup)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

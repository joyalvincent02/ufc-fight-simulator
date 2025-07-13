import { Link } from 'react-router-dom';
import PageLayout from '../components/PageLayout';
import HomeIcon from '@mui/icons-material/Home';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';

export default function NotFoundPage() {
  return (
    <PageLayout title="404 - Page Not Found">
      <div className="text-center py-12">
        <SportsKabaddiIcon 
          sx={{ fontSize: 80 }} 
          className="text-gray-400 dark:text-gray-600 mb-6" 
        />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Oops! This page took a submission
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or may have been moved. 
          Let's get you back to the action.
        </p>
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
          >
            <HomeIcon sx={{ fontSize: 20 }} />
            Back to Home
          </Link>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Or try one of these popular pages:
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/custom"
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition"
            >
              Custom Simulation
            </Link>
            <Link
              to="/events"
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition"
            >
              UFC Events
            </Link>
            <Link
              to="/models"
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition"
            >
              Prediction Models
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

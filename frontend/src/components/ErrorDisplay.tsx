import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

interface ErrorDisplayProps {
  error: string;
  variant?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  className?: string;
}

export default function ErrorDisplay({ 
  error, 
  variant = 'error', 
  onRetry,
  className = ''
}: ErrorDisplayProps) {
  const variants = {
    error: {
      icon: ErrorOutlineIcon,
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-700 dark:text-red-400',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: WarningAmberIcon,
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-700 dark:text-yellow-400',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: InfoOutlinedIcon,
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-700 dark:text-blue-400',
      iconColor: 'text-blue-500'
    }
  };

  const config = variants[variant];
  const IconComponent = config.icon;

  return (
    <div className={`
      ${config.bgColor} 
      ${config.borderColor} 
      border rounded-lg p-4 flex items-start gap-3 
      ${className}
    `}>
      <IconComponent 
        sx={{ fontSize: 20 }} 
        className={`${config.iconColor} mt-0.5 flex-shrink-0`} 
      />
      <div className="flex-1">
        <p className={`${config.textColor} text-sm font-medium`}>
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`
              mt-2 inline-flex items-center gap-1.5 text-xs font-medium
              ${config.textColor} hover:underline
            `}
          >
            <RefreshIcon sx={{ fontSize: 14 }} />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

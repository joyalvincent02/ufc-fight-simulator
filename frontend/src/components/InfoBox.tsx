import { type ReactNode, useState } from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface InfoBoxProps {
  title: string;
  icon?: string | ReactNode;
  variant?: 'info' | 'warning' | 'success';
  children: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export default function InfoBox({ 
  title, 
  icon, 
  variant = 'info', 
  children,
  collapsible = false,
  defaultExpanded = true
}: InfoBoxProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const variants = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300'
  };

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`${variants[variant]} p-3 rounded-lg border`}>
      <h5 
        className={`font-semibold mb-2 flex items-center gap-2 ${variant === 'info' ? 'text-blue-800 dark:text-blue-300' : variant === 'warning' ? 'text-yellow-800 dark:text-yellow-300' : 'text-green-800 dark:text-green-300'} ${collapsible ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={toggleExpanded}
      >
        {icon && <span className="flex items-center">{icon}</span>}
        <span className="flex-1">{title}</span>
        {collapsible && (
          <span className="flex items-center">
            {isExpanded ? <ExpandLessIcon sx={{ fontSize: 20 }} /> : <ExpandMoreIcon sx={{ fontSize: 20 }} />}
          </span>
        )}
      </h5>
      {(!collapsible || isExpanded) && (
        <div className="text-sm">
          {children}
        </div>
      )}
    </div>
  );
}

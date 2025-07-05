import { type ReactNode } from "react";

interface InfoBoxProps {
  title: string;
  icon?: string;
  variant?: 'info' | 'warning' | 'success';
  children: ReactNode;
}

export default function InfoBox({ 
  title, 
  icon, 
  variant = 'info', 
  children 
}: InfoBoxProps) {
  const variants = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/30 text-yellow-800 dark:text-yellow-300',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/30 text-green-800 dark:text-green-300'
  };

  return (
    <div className={`${variants[variant]} p-3 rounded-lg border`}>
      <h5 className={`font-semibold mb-2 ${variant === 'info' ? 'text-blue-800 dark:text-blue-300' : variant === 'warning' ? 'text-yellow-800 dark:text-yellow-300' : 'text-green-800 dark:text-green-300'}`}>
        {icon && `${icon} `}{title}
      </h5>
      <div className="text-sm">
        {children}
      </div>
    </div>
  );
}

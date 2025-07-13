interface SpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
}

const Spinner = ({ 
  message = "Simulating Fights", 
  size = 'md',
  overlay = true 
}: SpinnerProps) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative ${sizes[size]} mb-3`}>
        <div className="absolute inset-0 rounded-full border-4 border-gray-300 dark:border-white/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-red-600 animate-spin"></div>
      </div>
      <p className="text-sm text-gray-900 dark:text-white font-semibold tracking-wide uppercase">
        {message}
      </p>
    </div>
  );

  if (!overlay) {
    return spinner;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {spinner}
    </div>
  );
};

export default Spinner;



interface SkeletonLoaderProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export default function SkeletonLoader({ 
  variant = 'text', 
  width = '100%', 
  height = variant === 'text' ? '1.2em' : '200px',
  className = '' 
}: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-gray-300 dark:bg-gray-700";
  
  const variantClasses = {
    text: "rounded",
    rectangular: "rounded-lg",
    circular: "rounded-full"
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-label="Loading..."
    />
  );
}

// Usage examples:
// <SkeletonLoader variant="text" width="60%" />
// <SkeletonLoader variant="circular" width={100} height={100} />
// <SkeletonLoader variant="rectangular" height={200} />

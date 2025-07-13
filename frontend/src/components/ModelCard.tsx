import { type ReactNode } from "react";

interface ModelCardProps {
  id: string;
  title: string;
  description: string;
  icon: string | ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}

export default function ModelCard({ 
  id, 
  title, 
  description, 
  icon, 
  isExpanded, 
  onToggle, 
  children 
}: ModelCardProps) {
  return (
    <div className="bg-white/90 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
        onClick={() => onToggle(id)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-300 mb-2 flex items-center gap-2">
              <span className="flex items-center">{icon}</span>
              <span>{title}</span>
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{description}</p>
          </div>
          <div className="text-red-600 dark:text-red-400 text-xl ml-4">
            {isExpanded ? '−' : '+'}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-white/10">
          <div className="pt-4 space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

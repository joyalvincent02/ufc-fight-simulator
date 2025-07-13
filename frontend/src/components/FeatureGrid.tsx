import { type ReactNode } from "react";

interface FeatureGridProps {
  features: {
    title: string;
    icon: string | ReactNode;
    items: string[];
  }[];
}

export default function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((category, index) => (
        <div key={index} className="bg-white/90 dark:bg-white/5 p-3 rounded-lg border border-gray-200 dark:border-white/10">
          <h5 className="font-semibold text-red-600 dark:text-red-300 mb-2 flex items-center gap-2">
            <span className="flex items-center">{category.icon}</span>
            <span>{category.title}</span>
          </h5>
          <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
            {category.items.map((item, itemIndex) => (
              <li key={itemIndex}>• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

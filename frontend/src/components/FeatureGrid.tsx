interface FeatureGridProps {
  features: {
    title: string;
    icon: string;
    items: string[];
  }[];
}

export default function FeatureGrid({ features }: FeatureGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((category, index) => (
        <div key={index} className="bg-white/5 p-3 rounded-lg border border-white/10">
          <h5 className="font-semibold text-red-300 mb-2">
            {category.icon} {category.title}
          </h5>
          <ul className="text-sm space-y-1">
            {category.items.map((item, itemIndex) => (
              <li key={itemIndex}>• {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

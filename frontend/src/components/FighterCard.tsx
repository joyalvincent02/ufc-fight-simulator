import { useState, useEffect } from "react";

interface FighterCardProps {
  name: string;
  image?: string;
  winPercentage: number;
  exchangeChance?: number;
  borderColor: string;
  showExchangeChance?: boolean;
  penaltyScore?: number;
  additionalInfo?: React.ReactNode;
}

const FALLBACK_IMAGE = "https://www.ufc.com/themes/custom/ufc/assets/img/no-profile-image.png";

export default function FighterCard({
  name,
  image,
  winPercentage,
  exchangeChance,
  borderColor,
  showExchangeChance = false,
  penaltyScore,
  additionalInfo
}: FighterCardProps) {
  const [imgSrc, setImgSrc] = useState(image || FALLBACK_IMAGE);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError && imgSrc !== FALLBACK_IMAGE) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  // Reset image source when image prop changes
  useEffect(() => {
    setImgSrc(image || FALLBACK_IMAGE);
    setHasError(false);
  }, [image]);

  return (
    <div className="flex flex-col items-center text-center">
      <img
        src={imgSrc}
        alt={name}
        style={{ borderColor }}
        className="w-24 h-24 rounded-full object-cover border-4 mb-3"
        onError={handleImageError}
      />
      <p className="text-lg font-bold text-gray-900 dark:text-white">{name}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Win %: {winPercentage.toFixed(1)}%
      </p>
      {showExchangeChance && exchangeChance !== undefined && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Exchange Chance: {(exchangeChance * 100).toFixed(2)}%
        </p>
      )}
      {penaltyScore !== undefined && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <div className="bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
            <p className="text-yellow-600 dark:text-yellow-400 font-medium">Penalty: {(penaltyScore * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}
      {additionalInfo && additionalInfo}
    </div>
  );
}

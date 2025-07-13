import { useState, useEffect } from "react";
import PersonIcon from '@mui/icons-material/Person';

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
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    console.log(`Image failed to load for ${name}: ${imgSrc}`);
    if (!hasError && imgSrc !== FALLBACK_IMAGE) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
      setIsLoading(true); // Keep loading state for fallback
    } else {
      setIsLoading(false);
    }
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const target = event.target as HTMLImageElement;
    console.log(`Image loaded successfully for ${name}: ${imgSrc}`, {
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight,
      complete: target.complete
    });
    setIsLoading(false);
  };

  // Reset image source when image prop changes
  useEffect(() => {
    console.log(`Setting image for ${name}: ${image || FALLBACK_IMAGE}`);
    setImgSrc(image || FALLBACK_IMAGE);
    setHasError(false);
    setIsLoading(true);
    
    // Set a timeout to handle stuck loading states
    const timeout = setTimeout(() => {
      console.log(`Image loading timeout for ${name}, falling back...`);
      setIsLoading(false); // Stop loading state after timeout
    }, 8000); // 8 second timeout
    
    // Cleanup timeout
    return () => {
      clearTimeout(timeout);
    };
  }, [image, name]);

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-24 h-24 mb-3">
        {isLoading && (
          <div 
            style={{ borderColor }}
            className="absolute inset-0 rounded-full border-4 bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center"
          >
            <PersonIcon className="text-gray-400 dark:text-gray-500" sx={{ fontSize: 32 }} />
          </div>
        )}
        <img
          ref={(img) => {
            // Check if image is already loaded (cached)
            if (img && img.complete && img.naturalWidth > 0) {
              console.log(`Image already loaded for ${name}: ${imgSrc}`);
              setIsLoading(false);
            }
          }}
          src={imgSrc}
          alt={`${name} profile picture`}
          style={{ borderColor }}
          className={`w-24 h-24 rounded-full object-cover border-4 transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      </div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
        {name}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Win %: <span className="font-semibold">{winPercentage.toFixed(1)}%</span>
      </p>
      {showExchangeChance && exchangeChance !== undefined && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Exchange Chance: <span className="font-medium">{(exchangeChance * 100).toFixed(2)}%</span>
        </p>
      )}
      {penaltyScore !== undefined && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          <div className="bg-gray-100 dark:bg-gray-800/50 px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
            <p className="text-yellow-600 dark:text-yellow-400 font-medium">
              Penalty: {(penaltyScore * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      )}
      {additionalInfo && additionalInfo}
    </div>
  );
}

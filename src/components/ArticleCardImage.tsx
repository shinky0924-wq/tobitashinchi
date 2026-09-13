import { useState, useEffect, memo, FC } from 'react';
import { BookOpen } from 'lucide-react';

interface ArticleCardImageProps {
  src?: string;
  alt?: string;
  categoryLabel?: string;
  category?: string;
  className?: string;
  isDetailHero?: boolean;
}

const DEFAULT_FALLBACK_IMAGE = '/images/tobita_bright_future_1789106917071.jpg';

const normalizeUrl = (originalUrl?: string): string => {
  if (!originalUrl) return DEFAULT_FALLBACK_IMAGE;
  const trimmed = originalUrl.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const filename = trimmed.split('/').pop()?.split('?')[0] || '';
  if (!filename) return DEFAULT_FALLBACK_IMAGE;
  return `/images/${filename}`;
};

export const ArticleCardImage: FC<ArticleCardImageProps> = memo(({
  src,
  alt = '',
  categoryLabel,
  category,
  className = '',
  isDetailHero = false,
}) => {
  const [imgSrc, setImgSrc] = useState<string>(() => normalizeUrl(src));
  const [failed, setFailed] = useState<boolean>(false);
  const [triedFallback, setTriedFallback] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(normalizeUrl(src));
    setFailed(false);
    setTriedFallback(false);
  }, [src]);

  const handleError = () => {
    if (!triedFallback) {
      setTriedFallback(true);
      setImgSrc(DEFAULT_FALLBACK_IMAGE);
    } else {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-rose-100 to-pink-200 flex flex-col items-center justify-center text-secondary p-4 ${className}`}>
        <BookOpen className="w-8 h-8 opacity-70 mb-1" />
        <span className="text-xs font-bold">{categoryLabel || 'お仕事コラム'}</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-rose-50 flex items-center justify-center ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={handleError}
        className={`w-full h-full object-cover transition-transform duration-500 ${
          !isDetailHero ? 'group-hover:scale-105' : ''
        }`}
      />
    </div>
  );
});

ArticleCardImage.displayName = 'ArticleCardImage';


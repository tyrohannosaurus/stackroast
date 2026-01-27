import { useState } from 'react';
import { Box } from 'lucide-react';

interface ToolLogoProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function ToolLogo({ src, alt, size = 'md', className = '' }: ToolLogoProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  // Show fallback if no src or if image failed to load
  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} rounded bg-muted flex items-center justify-center shrink-0 ${className}`}
        title={alt}
      >
        <Box className={`${iconSize} text-muted-foreground`} />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} relative shrink-0 ${className}`}>
      {isLoading && (
        <div className={`${sizeClass} absolute inset-0 rounded bg-muted animate-pulse`} />
      )}
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        loading="lazy"
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

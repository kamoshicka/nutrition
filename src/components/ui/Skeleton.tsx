'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton component for displaying loading placeholders
 * 
 * This component shows a placeholder with animation while content is loading.
 * It can be customized with different shapes and sizes.
 */
export default function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  // Base classes for all skeleton types
  let baseClasses = 'bg-gray-200 inline-block';
  
  // Animation classes
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };
  
  // Variant specific classes
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-md',
  };
  
  // Combine all classes
  const classes = `${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`;
  
  // Create style object for width and height
  const style: React.CSSProperties = {};
  
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }
  
  return <span className={classes} style={style} aria-hidden="true" />;
}
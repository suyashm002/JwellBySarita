import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'image' | 'card';
}

function Skeleton({ className, variant = 'text', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-200',
        variant === 'text' && 'h-4 w-full',
        variant === 'image' && 'aspect-square w-full rounded-lg',
        variant === 'card' && 'h-48 w-full rounded-xl',
        className
      )}
      {...props}
    />
  );
}

/* Convenience: a skeleton group that mimics a product card */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <Skeleton variant="image" />
      <Skeleton variant="text" className="h-4 w-3/4" />
      <Skeleton variant="text" className="h-3 w-1/2" />
      <Skeleton variant="text" className="h-8 w-28" />
    </div>
  );
}

export { Skeleton, SkeletonCard };

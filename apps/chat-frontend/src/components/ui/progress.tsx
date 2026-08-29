'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorColor?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorColor = 'bg-[#0070f3]', ...props }, ref) => (
    <div
      ref={ref}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full bg-[#1f1f1f] border border-[#262626]/50',
        className
      )}
      {...props}
    >
      <div
        className={cn('h-full transition-all duration-300 rounded-full', indicatorColor)}
        style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
      />
    </div>
  )
);
Progress.displayName = 'Progress';

export { Progress };

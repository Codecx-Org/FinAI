import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;        // adds amber border glow
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function GlassPanel({ 
  children, 
  className, 
  glow = false,
  padding = 'md'
}: GlassPanelProps) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={cn(
      "glass-panel overflow-hidden",
      glow && "glass-panel-glow",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
}

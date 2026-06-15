"use client";

import React, { useRef } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MagneticButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'lg';
  className?: string;
}

export function MagneticButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement | HTMLAnchorElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 20, mass: 1 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Max displacement roughly 10% of distance, capped at 6px is hard with just multipliers
    // But 0.1 factor is a good heuristic for "magnetic" feel
    mouseX.set((e.clientX - centerX) * 0.15);
    mouseY.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const content = (
    <motion.span
      style={{ x: springX, y: springY }}
      className="relative z-10 flex items-center justify-center gap-2 pointer-events-none"
    >
      {children}
    </motion.span>
  );

  const baseClasses = cn(
    "relative inline-flex items-center justify-center font-display font-medium transition-all duration-300 active:scale-[0.97] group",
    size === 'md' ? "px-6 py-2.5 text-sm" : "px-8 py-3.5 text-base",
    variant === 'primary' 
      ? "bg-brand-amber text-bg-void rounded-full overflow-hidden hover:shadow-[0_0_24px_rgba(245,158,11,0.25)]" 
      : "bg-transparent text-text-primary border border-border-default rounded-full hover:bg-white/5",
    className
  );

  const shimmer = variant === 'primary' && (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  );

  if (href) {
    return (
      <a 
        href={href} 
        ref={ref as any}
        className={baseClasses}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {shimmer}
        {content}
      </a>
    );
  }

  return (
    <button
      ref={ref as any}
      onClick={onClick}
      className={baseClasses}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {shimmer}
      {content}
    </button>
  );
}

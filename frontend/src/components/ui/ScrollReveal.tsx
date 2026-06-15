"use client";

import React from 'react';
import { motion, useInView, useReducedMotion, Variants } from 'framer-motion';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'right' | 'down';
  perspective?: boolean;
  className?: string;
  delay?: number;
  duration?: number;
  distance?: number;
}

export function ScrollReveal({
  children,
  direction = 'up',
  perspective = false,
  className,
  delay = 0,
  duration = 0.8,
  distance = 40,
}: ScrollRevealProps) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const prefersReducedMotion = useReducedMotion();

  const springConfig = { stiffness: 120, damping: 20, mass: 1 }; // §1.1 Mandatory spring config

  const getInitialProps = () => {
    if (perspective) return { rotateX: 8, y: distance, opacity: 0 };
    switch (direction) {
      case 'up': return { y: distance, opacity: 0 };
      case 'down': return { y: -distance, opacity: 0 };
      case 'left': return { x: distance, opacity: 0 };
      case 'right': return { x: -distance, opacity: 0 };
      default: return { y: distance, opacity: 0 };
    }
  };

  const variants: Variants = {
    hidden: prefersReducedMotion ? { opacity: 0 } : getInitialProps(),
    visible: { 
      opacity: 1, 
      rotateX: 0, 
      x: 0, 
      y: 0,
      transition: { 
        ...springConfig,
        type: "spring",
        delay
      }
    }
  };

  return (
    <div 
      ref={ref} 
      className={className} 
      style={{ 
        perspective: perspective ? "1200px" : "none",
        willChange: "transform, opacity" // §10.4 Prevent scroll jank
      }}
    >
      <motion.div
        variants={variants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ScrollRevealGroup({ 
  children, 
  staggerDelay = 0.1, 
  className,
  once = true,
}: { 
  children: React.ReactNode, 
  staggerDelay?: number, 
  className?: string,
  once?: boolean
}) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once, margin: "-80px" });

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
}

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring",
      stiffness: 120,
      damping: 20,
      mass: 1
    } 
  }
};

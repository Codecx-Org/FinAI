"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';

interface HeroTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function HeroText({ text, className, delay = 0 }: HeroTextProps) {
  const words = text.split(" ");

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: delay },
    },
  };

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        // §1.1 Mandatory spring config
        type: "spring",
        stiffness: 120,
        damping: 20,
        mass: 1
      },
    },
    hidden: {
      opacity: 0,
      y: 40,
    },
  };

  return (
    <motion.h1
      className={className}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, index) => (
        <motion.span
          key={index}
          className="inline-block mr-[0.25em] last:mr-0"
          variants={child}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
}

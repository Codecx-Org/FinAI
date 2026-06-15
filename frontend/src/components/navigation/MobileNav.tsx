"use client";

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { X } from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  links: { name: string, href: string }[];
}

export function MobileNav({ isOpen, onClose, links }: MobileNavProps) {
  const containerVariants: Variants = {
    hidden: { x: '100%' },
    visible: { 
      x: 0,
      transition: { 
        type: 'spring', 
        stiffness: 120, 
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: { 
      x: '100%',
      transition: { 
        type: 'spring', 
        stiffness: 120, 
        damping: 20 
      }
    }
  };

  const linkVariants: Variants = {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-[110] bg-bg-void/95 backdrop-blur-2xl flex flex-col p-8"
    >
      <div className="flex justify-between items-center mb-12">
        <a href="/" className="font-display text-2xl font-bold tracking-tight">
          <span className="text-text-primary">Biz</span>
          <span className="text-brand-amber">Sawa</span>
        </a>
        <button onClick={onClose} className="p-2 text-text-primary">
          <X size={32} />
        </button>
      </div>

      <div className="flex flex-col gap-8 flex-1">
        {links.map((link) => (
          <motion.a
            key={link.name}
            href={link.href}
            onClick={onClose}
            variants={linkVariants}
            className="text-4xl font-display font-bold text-text-primary hover:text-brand-amber transition-colors"
          >
            {link.name}
          </motion.a>
        ))}
      </div>

      <motion.div variants={linkVariants} className="mt-auto">
        <MagneticButton variant="primary" size="lg" className="w-full">
          Get Started Free
        </MagneticButton>
      </motion.div>
    </motion.div>
  );
}

"use client";

import React from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { ScrollReveal, ScrollRevealGroup, revealItemVariants } from '../ui/ScrollReveal';
import { motion } from 'framer-motion';

export function Personas() {
  const personas = [
    {
      type: "Agrovet & Farmers",
      quote: "I track every bag of feed I sell. BizSawa tells me which brand is making me the most money.",
      visual: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <rect x="30" y="40" width="40" height="50" rx="4" fill="var(--color-brand-amber)" opacity="0.2" />
          <path d="M50 20 L30 45 L70 45 Z" fill="var(--color-brand-amber)" />
          <circle cx="50" cy="65" r="10" stroke="var(--color-brand-amber)" fill="none" strokeWidth="2" />
        </svg>
      )
    },
    {
      type: "Retail Shop / Duka",
      quote: "I used to run out of sugar every week. Now I get an alert on my phone before the shelf is empty.",
      visual: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <rect x="25" y="30" width="50" height="60" rx="4" fill="var(--color-brand-amber)" opacity="0.2" />
          <rect x="35" y="40" width="10" height="10" fill="var(--color-brand-amber)" />
          <rect x="55" y="40" width="10" height="10" fill="var(--color-brand-amber)" />
          <rect x="35" y="60" width="30" height="2" fill="var(--color-brand-amber)" />
        </svg>
      )
    },
    {
      type: "Restaurant / Hotel",
      quote: "Peek hours used to be chaos. Now the AI predicts my busiest times so I can prepare early.",
      visual: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <circle cx="50" cy="50" r="30" fill="var(--color-brand-amber)" opacity="0.2" />
          <path d="M40 40 L60 40 L55 70 L45 70 Z" fill="var(--color-brand-amber)" />
          <path d="M35 35 Q50 25 65 35" stroke="var(--color-brand-amber)" fill="none" strokeWidth="3" />
        </svg>
      )
    },
    {
      type: "Services / Fundi",
      quote: "Tracking payments for different jobs was a nightmare. M-Pesa sync does it for me automatically.",
      visual: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <rect x="30" y="30" width="40" height="40" rx="2" stroke="var(--color-brand-amber)" fill="none" strokeWidth="2" />
          <path d="M40 30 V20 Q50 15 60 20 V30" stroke="var(--color-brand-amber)" fill="none" strokeWidth="2" />
          <circle cx="50" cy="50" r="5" fill="var(--color-brand-amber)" />
        </svg>
      )
    },
    {
      type: "Fashion Boutique",
      quote: "My Instagram page looks professional now. The AI creates beautiful posts for my new arrivals.",
      visual: (
        <svg viewBox="0 0 100 100" className="w-16 h-16">
          <path d="M30 30 L70 30 L80 90 L20 90 Z" fill="var(--color-brand-amber)" opacity="0.2" />
          <path d="M40 30 V25 Q50 20 60 25 V30" stroke="var(--color-brand-amber)" fill="none" strokeWidth="2" />
          <circle cx="50" cy="45" r="4" fill="var(--color-brand-amber)" />
        </svg>
      )
    }
  ];

  return (
    <section id="personas" className="py-24 bg-bg-void overflow-hidden">
      <div className="container mx-auto px-6">
        <ScrollReveal className="text-center mb-20">
          <span className="text-brand-amber text-[10px] font-bold tracking-[0.3em] uppercase">Built for you</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4 tracking-tight">Whatever your counter.</h2>
        </ScrollReveal>

        <ScrollRevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {personas.map((persona, i) => (
            <motion.div key={i} variants={revealItemVariants} className="flex">
              <GlassPanel className="w-full flex flex-col items-center text-center group hover:bg-white/[0.05] transition-colors p-8">
                <div className="mb-8 p-4 rounded-full bg-brand-amber/[0.03] border border-brand-amber/10 group-hover:scale-110 group-hover:bg-brand-amber/10 transition-all duration-500">
                  {persona.visual}
                </div>
                <span className="text-[10px] font-bold text-brand-amber uppercase tracking-widest mb-6">
                  {persona.type}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed italic">
                  "{persona.quote}"
                </p>
              </GlassPanel>
            </motion.div>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}

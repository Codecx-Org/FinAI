"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '../ui/ScrollReveal';

export function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Create your account",
      description: "Sign up with your email. Tell us about your business. Done in 90 seconds."
    },
    {
      number: 2,
      title: "Add your products",
      description: "Enter what you sell. Link your M-Pesa number. The AI starts learning immediately."
    },
    {
      number: 3,
      title: "Watch your business grow",
      description: "Log sales. Get coached. Post to Instagram. Borrow confidently."
    }
  ];

  return (
    <section id="how-it-works" className="py-32 bg-bg-deep overflow-hidden">
      <div className="container mx-auto px-6">
        <ScrollReveal className="mb-24 text-center lg:text-left">
          <span className="text-brand-amber text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block font-body">Step by step</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight">Simple from day one.</h2>
        </ScrollReveal>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-12 left-[12.5%] right-[12.5%] h-px bg-white/5 hidden lg:block" />
          <motion.div 
            className="absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-brand-amber/20 via-brand-amber to-brand-amber/20 hidden lg:block"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            style={{ originX: 0 }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-12 relative z-10">
            {steps.map((step, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 0.2} className="flex flex-col items-center lg:items-start text-center lg:text-left gap-8">
                <div className="w-24 h-24 rounded-full bg-bg-void border border-white/10 flex items-center justify-center text-5xl font-display font-bold text-brand-amber shadow-2xl relative group">
                   <div className="absolute inset-0 rounded-full bg-brand-amber/5 blur-xl group-hover:bg-brand-amber/10 transition-colors" />
                   <span className="relative z-10">{step.number}</span>
                </div>
                <div className="flex flex-col gap-4 max-w-sm">
                  <h3 className="text-2xl font-display font-bold text-text-primary tracking-tight">{step.title}</h3>
                  <p className="text-text-secondary leading-relaxed text-lg">
                    {step.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

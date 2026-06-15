"use client";

import React from 'react';
import { GlassPanel } from '../ui/GlassPanel';
import { ScrollReveal } from '../ui/ScrollReveal';
import { Brain, TrendingUp, Package, Smartphone, Sparkles, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  visual?: React.ReactNode;
  delay?: number;
}

function FeatureCard({ icon, title, description, className, visual, delay }: FeatureCardProps) {
  return (
    <ScrollReveal 
      perspective // §3 Section 3
      delay={delay} 
      className={className}
    >
      <GlassPanel glow className="h-full flex flex-col group hover:border-brand-amber/40 transition-colors border-white/5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-brand-amber/10 flex items-center justify-center text-brand-amber border border-brand-amber/20 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          <h3 className="text-xl font-display font-bold text-text-primary tracking-tight">{title}</h3>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-6 font-body">
          {description}
        </p>
        {visual && (
          <div className="mt-auto pt-6 border-t border-white/5 select-none" style={{ willChange: "transform" }}>
            {visual}
          </div>
        )}
      </GlassPanel>
    </ScrollReveal>
  );
}

export function FeatureGrid() {
  return (
    <section id="features" className="py-24 bg-bg-void relative overflow-hidden">
      <div className="container mx-auto px-6">
        <ScrollReveal className="text-center mb-20">
          <span className="text-brand-amber text-[10px] font-bold tracking-[0.3em] uppercase mb-4 block font-body">What's inside</span>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 tracking-tight">
            Built for your counter.
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg font-body">
            We didn't build a complex ERP. We built an assistant that lives in your pocket and speaks your language.
          </p>
        </ScrollReveal>

        {/* Alternating bento-style layout (§3 Section 3) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1: Large(60) Small(40) -> md: grid-cols-2 is better for layout control */}
          <FeatureCard 
            className="lg:col-span-2"
            icon={<Brain size={24} />}
            title="AI Business Coach"
            description="Ask anything in English or Swahili. Get advice based on your actual sales — not generic tips. Your AI that knows your numbers."
            delay={0.1}
            visual={
              <div className="flex flex-col gap-3 font-body">
                <div className="bg-bg-void/50 p-3 rounded-2xl rounded-tl-none text-[11px] border border-white/5 max-w-[80%] self-start">
                   Je, nikitenga Ksh 10k kwa stock mpya, nitarudisha faida lini?
                </div>
                <div className="bg-brand-amber/10 p-3 rounded-2xl rounded-tr-none text-[11px] border border-brand-amber/20 max-w-[80%] self-end text-text-primary font-medium">
                  Kulingana na mauzo yako, utarudisha hiyo faida ndani ya siku 14...
                </div>
              </div>
            }
          />
          <FeatureCard 
            icon={<TrendingUp size={24} />}
            title="Sales Tracker"
            description="Every sale, tracked. Log from your phone. See the picture immediately."
            delay={0.2}
            visual={
              <div className="h-20 flex items-end gap-1.5 px-2">
                {[30, 60, 45, 80, 50, 90, 75].map((h, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    className="flex-1 bg-brand-amber/20 rounded-t-sm"
                  />
                ))}
              </div>
            }
          />

          {/* Row 2: Small Small Small */}
          <FeatureCard 
            icon={<Package size={24} />}
            title="Inventory Manager"
            description="Know before you run out. Real-time alerts before stock hits zero."
            delay={0.3}
          />
          <FeatureCard 
            icon={<Smartphone size={24} />}
            title="M-Pesa Integration"
            description="Payments, automatic. Link your M-Pesa. Every transaction tracked effortlessly."
            delay={0.4}
            visual={
              <div className="flex flex-col gap-2 font-mono">
                <div className="flex justify-between items-center text-[10px] text-text-muted border-b border-white/5 pb-2">
                   <span>M-PESA CONFIRMED</span>
                   <span className="text-brand-green">+ KES 2,450</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-text-muted">
                   <span>M-PESA CONFIRMED</span>
                   <span className="text-brand-green">+ KES 1,100</span>
                </div>
              </div>
            }
          />
          <FeatureCard 
            icon={<Sparkles size={24} />}
            title="Social Media Gen"
            description="Professional posts in 30 seconds. AI writes the caption and generates images."
            delay={0.5}
          />

          {/* Row 3: Large(40) Large(60) -> span 3 to simplify */}
          <FeatureCard 
            className="lg:col-span-3"
            icon={<Receipt size={24} />}
            title="Loan & SACCO Guide"
            description="Know what you can borrow. Real products from KCB, Equity, and SACCOs — matched to your sales data. Access credit with confidence."
            delay={0.6}
            visual={
              <div className="flex gap-4 overflow-hidden font-display">
                <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-brand-amber uppercase tracking-widest">KCB Biashara</span>
                  <div className="text-xl font-bold mt-1 text-text-primary">KES 250,000</div>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl">
                  <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Equity Eazzy</span>
                  <div className="text-xl font-bold mt-1 text-text-primary">KES 180,000</div>
                </div>
                <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl opacity-30">
                   <span className="text-[10px] font-bold uppercase tracking-widest">Co-op Bank</span>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </section>
  );
}

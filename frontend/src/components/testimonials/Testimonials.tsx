"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    quote: "Since I started using BizSawa, I can see exactly which products make me money. I stopped selling things at a loss without even knowing it.",
    name: "Grace Wanjiku",
    role: "Agrovet Owner",
    location: "Nairobi",
  },
  {
    quote: "The AI Coach told me exactly how much I could borrow based on my actual sales. I walked into the bank confident for the first time.",
    name: "Joseph Mutua",
    role: "Hardware Shop",
    location: "Mombasa",
  },
  {
    quote: "I used to spend hours on Instagram posts. Now BizSawa makes them for me in 30 seconds and my page looks more professional than ever.",
    name: "Amina Farah",
    role: "Fashion Boutique",
    location: "Kisumu",
  },
];

export const Testimonials = () => {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Loved by <span className="text-primary-green">thousands</span> of entrepreneurs.
          </h2>
          <p className="text-text-secondary">
            Don't just take our word for it. Here's how BizSawa is transforming businesses across Kenya.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-8 relative flex flex-col justify-between"
            >
              <div className="text-primary-green text-5xl font-serif absolute top-4 right-8 opacity-20">“</div>
              <p className="text-text-secondary italic mb-8 relative z-10 leading-relaxed">
                "{t.quote}"
              </p>
              <div>
                <div className="font-bold text-text-primary">{t.name}</div>
                <div className="text-xs text-text-muted uppercase tracking-widest">{t.role} • {t.location}</div>
                <div className="mt-4 inline-flex items-center gap-1 bg-primary-green/10 text-primary-green text-[10px] font-bold px-2 py-0.5 rounded">
                    Verified BizSawa User
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

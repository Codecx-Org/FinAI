"use client";
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const FinalCTA = () => {
  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--color-primary-green-dim)_0%,_transparent_70%)] opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto glass-panel p-12 md:p-20 border-glow"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight leading-tight">
            Your business has been managing itself.<br />
            <span className="text-primary-green">Now let's manage it better.</span>
          </h2>
          <p className="text-text-secondary text-xl mb-12 max-w-2xl mx-auto">
            Start free today. No credit card required. Works on any phone, anywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" className="h-16 px-10 text-xl rounded-2xl bg-primary-green hover:bg-primary-green/90 text-white shadow-2xl shadow-primary-green/40 hover:scale-105 transition-transform">
              Create your free account →
            </Button>
            <Button variant="ghost" size="lg" className="h-16 px-10 text-xl rounded-2xl border border-border hover:bg-muted">
              Sign In
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

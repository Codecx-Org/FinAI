"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      name: "Starter",
      price: isYearly ? "0" : "0",
      description: "Perfect for new side hustles and small dukas just getting started.",
      features: [
        "Up to 50 sales/month",
        "Basic inventory tracking",
        "AI Coach (5 questions/day)",
        "Single user access",
        "Standard support"
      ],
      cta: "Get Started Free",
      featured: false
    },
    {
      name: "Growth",
      price: isYearly ? "9,990" : "999",
      period: isYearly ? "/year" : "/month",
      description: "The complete toolkit for scaling your business with AI efficiency.",
      features: [
        "Unlimited sales tracking",
        "Full inventory manager",
        "Unlimited AI Coach",
        "Social media generator",
        "Loan & SACCO matching",
        "M-Pesa auto-sync",
        "Priority 24/7 support"
      ],
      cta: "Start 14-Day Free Trial",
      featured: true
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-bg-deep relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            Simple, <span className="text-primary-green">transparent</span> pricing.
          </h2>
          <p className="text-text-secondary text-lg mb-10">
            No hidden fees. No complicated tiers. Just the tools you need to run your business better.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={cn("text-sm font-medium", !isYearly ? "text-primary-green" : "text-text-muted")}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 bg-muted rounded-full p-1 transition-colors"
            >
              <motion.div
                animate={{ x: isYearly ? 28 : 0 }}
                className="w-5 h-5 bg-primary-green rounded-full shadow-lg"
              />
            </button>
            <span className={cn("text-sm font-medium", isYearly ? "text-primary-green" : "text-text-muted")}>
              Yearly <span className="text-[10px] bg-primary-green/10 px-2 py-0.5 rounded-full ml-1">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              whileHover={{ y: -10 }}
              className={cn(
                "glass-panel p-8 md:p-12 relative flex flex-col",
                plan.featured ? "border-primary-green border-2 shadow-xl shadow-primary-green/5" : "border-border"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-green text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">Ksh {plan.price}</span>
                  <span className="text-text-muted">{plan.period}</span>
                </div>
                <p className="text-text-muted mt-4 text-sm leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 w-5 h-5 rounded-full bg-primary-green/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-green" />
                    </div>
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={cn(
                  "w-full h-14 rounded-xl text-lg font-bold transition-all",
                  plan.featured 
                    ? "bg-primary-green hover:bg-primary-green/90 text-white shadow-lg shadow-primary-green/20" 
                    : "bg-muted hover:bg-muted/80 text-text-primary"
                )}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

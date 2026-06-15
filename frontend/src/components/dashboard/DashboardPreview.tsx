"use client";
import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ShoppingBag, Package, Brain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DashboardPreview = () => {
  return (
    <section className="py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-primary-green font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Inside the App</div>
          <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-[1.1]">
            Experience the <span className="text-primary-green">Sawa</span> workflow.
          </h2>
          <p className="text-text-secondary">
            A beautiful, intuitive interface designed for busy entrepreneurs. 
            No accountant needed — just your business, finally understood.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Dashboard Container */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-6 md:p-10 relative z-10 border-glow"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-bold">Good morning, Grace 👋</h3>
                <p className="text-text-muted text-sm">Here's how your shop is performing today.</p>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-primary-green/10 flex items-center justify-center">
                   <Brain className="w-5 h-5 text-primary-green" />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                   <div className="w-2 h-2 rounded-full bg-primary-green animate-pulse" />
                 </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <StatCard label="Today's Sales" value="Ksh 14,850" trend="+12%" icon={<ShoppingBag />} />
              <StatCard label="Total Revenue" value="Ksh 92,400" trend="+5.4%" icon={<ArrowUpRight />} />
              <StatCard label="Inventory Alerts" value="3 items" trend="Low stock" icon={<Package />} variant="warning" />
              <StatCard label="AI Coach" value="2 new" trend="Insights" icon={<Sparkles />} variant="brand" />
            </div>

            {/* Content Area */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Sales Chart Placeholder */}
              <div className="lg:col-span-2 bg-muted/30 rounded-2xl p-6 h-[250px] relative overflow-hidden border border-border">
                 <div className="flex items-center justify-between mb-4">
                   <span className="font-bold text-sm">Revenue Trends</span>
                   <span className="text-xs text-text-muted">Last 7 Days</span>
                 </div>
                 <div className="absolute inset-x-0 bottom-0 h-32">
                    <svg className="w-full h-full" preserveAspectRatio="none">
                      <motion.path
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        d="M0 80 Q 100 20, 200 60 T 400 30 T 600 70 T 800 10 T 1000 50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-primary-green"
                      />
                    </svg>
                 </div>
              </div>

              {/* AI Coach Card */}
              <div className="bg-primary-green p-6 rounded-2xl text-white relative overflow-hidden flex flex-col justify-between">
                 <Brain className="absolute -right-4 -top-4 w-24 h-24 opacity-10" />
                 <div>
                   <h4 className="font-bold text-lg mb-2">AI Coach Insight</h4>
                   <p className="text-white/80 text-sm leading-relaxed italic">
                     "Your Chick Mash sales are up 24% this week. Consider restocking before Thursday to avoid lost sales."
                   </p>
                 </div>
                 <Button variant="secondary" size="sm" className="w-full mt-6 bg-white text-primary-green hover:bg-white/90 font-bold">
                   Take Action
                 </Button>
              </div>
            </div>
          </motion.div>

          {/* Abstract blobs for depth */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary-green/5 blur-[100px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-amber/5 blur-[100px] rounded-full" />
        </div>
      </div>
    </section>
  );
};

const StatCard = ({ label, value, trend, icon, variant = "default" }: any) => {
  return (
    <div className="bg-muted/30 rounded-2xl p-5 border border-border hover:border-primary-green/30 transition-colors">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
        variant === "warning" ? "bg-amber-100 text-amber-600" : 
        variant === "brand" ? "bg-primary-green/10 text-primary-green" : "bg-primary-green/10 text-primary-green"
      )}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <p className="text-text-muted text-xs uppercase tracking-widest font-bold mb-1">{label}</p>
      <div className="flex items-baseline justify-between">
        <h4 className="text-xl font-black">{value}</h4>
        <span className={cn(
          "text-[10px] font-bold px-1.5 py-0.5 rounded",
          variant === "warning" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
        )}>{trend}</span>
      </div>
    </div>
  );
};

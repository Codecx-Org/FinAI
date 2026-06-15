"use client";
import React, { useRef } from "react";
import { useScroll, motion, useTransform, useSpring } from "framer-motion";
import { PhoneMockup } from "@/components/ui/phone-mockup";
import { BorderBeam } from "@/components/magicui/border-beam";
import Image from "next/image";

const features = [
  {
    title: "AI Business Coach",
    description: "Get personalized advice based on your real sales data. Ask in English or Swahili and get answers instantly.",
    screen: "/assets/AI_Coach.png",
    color: "#166530"
  },
  {
    title: "Content Generation",
    description: "AI writes the captions and generates images for your Instagram, WhatsApp, and Facebook posts in seconds.",
    screen: "/assets/Social_Generator.png",
    color: "#F59E0B"
  },
  {
    title: "Sales Tracking",
    description: "Log every sale in seconds. See your daily, weekly, and monthly revenue at a glance without any manual math.",
    screen: "/assets/Sales_Mobile_View.png",
    color: "#166530"
  },
  {
    title: "Inventory Management",
    description: "Real-time stock levels with low-stock alerts. Know what's selling and what needs restocking before you run out.",
    screen: "/assets/Inventory_Mobile.png",
    color: "#10B981"
  },
  {
    title: "M-Pesa Integration",
    description: "Automatic payment tracking linked to your M-Pesa number. Every transaction is logged without lifting a finger.",
    screen: "/assets/Mpesa_Tablet.png",
    color: "#166530"
  },
  {
    title: "Loan Application Readiness",
    description: "Get matched with real loan products from banks and SACCOs based on your actual business performance data.",
    screen: "/assets/Loan_Guide.png",
    color: "#F59E0B"
  }
];

export const Features = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div ref={containerRef} className="relative h-[600vh]">
      <div className="sticky top-0 h-screen w-full flex items-center overflow-hidden">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center h-full py-20">
          
          {/* Left Side: Textual Information */}
          <div className="relative h-full flex flex-col justify-center">
            {features.map((feature, index) => {
              const start = index / features.length;
              const end = (index + 1) / features.length;
              
              const opacity = useTransform(smoothProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
              const translateY = useTransform(smoothProgress, [start, start + 0.1, end - 0.1, end], [20, 0, 0, -20]);

              return (
                <motion.div
                  key={index}
                  style={{ opacity, y: translateY, position: "absolute" }}
                  className="glass-panel p-8 md:p-12 relative overflow-hidden"
                >
                  <BorderBeam 
                    size={400} 
                    duration={8} 
                    colorFrom={feature.color} 
                    colorTo="#F59E0B" 
                  />
                  <div className="inline-block px-3 py-1 rounded-full bg-primary-green-dim text-primary-green text-xs font-bold uppercase tracking-widest mb-4">
                    Feature 0{index + 1}
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                    {feature.title}
                  </h2>
                  <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right Side: Mobile Screen Slider */}
          <div className="flex justify-center items-center h-full relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="w-96 h-96 bg-primary-green blur-[120px] rounded-full" />
            </div>
            
            <div className="relative w-[320px] h-[650px] flex items-center justify-center">
              {features.map((feature, index) => {
                 const start = index / features.length;
                 const end = (index + 1) / features.length;
                 
                 const opacity = useTransform(smoothProgress, [start, start + 0.05, end - 0.05, end], [0, 1, 1, 0]);
                 const scale = useTransform(smoothProgress, [start, start + 0.05, end - 0.05, end], [0.8, 1, 1, 1.1]);

                 return (
                   <motion.div
                     key={index}
                     style={{ opacity, scale, position: "absolute" }}
                     className="w-full h-full"
                   >
                     <Image
                       src={feature.screen}
                       alt={feature.title}
                       fill
                       className="object-contain"
                     />
                   </motion.div>
                 );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

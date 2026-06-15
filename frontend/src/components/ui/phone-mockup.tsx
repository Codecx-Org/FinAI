import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
  priority?: boolean;
}

export const PhoneMockup = ({ children, className }: PhoneMockupProps) => {
  return (
    <div className={cn("relative mx-auto", className)}>
      {/* Device Frame */}
      <div className="relative mx-auto border-gray-900 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[3rem] h-[650px] w-[320px] shadow-2xl">
        {/* Antenna lines */}
        <div className="absolute top-[80px] -left-[17px] w-[3px] h-[40px] bg-gray-800 rounded-l-lg" />
        <div className="absolute top-[140px] -left-[17px] w-[3px] h-[40px] bg-gray-800 rounded-l-lg" />
        
        {/* Volume Buttons */}
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg" />
        <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg" />
        
        {/* Power Button */}
        <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg" />

        {/* Dynamic Island / Notch */}
        <div className="w-[120px] h-[34px] bg-gray-900 top-[12px] left-1/2 -translate-x-1/2 rounded-[1rem] absolute z-20 flex items-center justify-center">
            {/* Camera Lens */}
            <div className="w-3 h-3 rounded-full bg-[#1a1a1a] mr-2 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]" />
            </div>
            {/* Sensor */}
            <div className="w-8 h-1 bg-[#1a1a1a] rounded-full" />
        </div>

        {/* Screen Content Container */}
        <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-white dark:bg-black relative">
          {children}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 dark:bg-gray-800 rounded-full z-20" />
      </div>
    </div>
  );
};

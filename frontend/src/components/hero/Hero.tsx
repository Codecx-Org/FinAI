"use client";
import React, { Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";

const HeroScene = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#166530" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#F59E0B" />
        <Suspense fallback={null}>
          <Sphere args={[1, 100, 200]} scale={2.5}>
            <MeshDistortMaterial
              color="#166530"
              attach="material"
              distort={0.4}
              speed={1.5}
              roughness={0.2}
              metalness={0.8}
              opacity={0.15}
              transparent
            />
          </Sphere>
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
    </div>
  );
};

const screens = [
  "/assets/Home_Tablet.png",
  "/assets/Sales_Mobile_View.png",
  "/assets/Inventory_Mobile.png",
  "/assets/AI_Coach.png",
  "/assets/Social_Generator.png",
  "/assets/Loan_Guide.png",
  "/assets/Mpesa_Tablet.png",
];

export const Hero = () => {
  const [currentScreen, setCurrentScreen] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <HeroScene />
      
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-2xl"
        >
              
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[0.95]">
            Your business,<br />
            <span className="text-primary-green">finally understood.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-lg">
            BizSawa tracks every shilling, coaches your strategy, and writes your social posts — all from the palm of your hand.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="h-14 px-8 text-lg rounded-xl bg-primary-green hover:bg-primary-green/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-green/20">
              Start Free Today
            </Button>
            <Button variant="ghost" size="lg" className="h-14 px-8 text-lg rounded-xl border border-border hover:bg-muted transition-all">
              Watch how it works <span className="ml-2">→</span>
            </Button>
          </div>
          
          <div className="mt-12 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-primary-green/20 to-brand-amber/20" />
                </div>
              ))}
            </div>
            <p className="text-text-muted text-sm">
              <span className="font-bold text-text-primary">12,000+</span> entrepreneurs across Kenya
            </p>
          </div>
        </motion.div>

        {/* Right Content - Phone Mockup (Frame Removed) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative perspective-1000 flex justify-center items-center"
        >
          <div className="absolute -inset-4 bg-primary-green/10 blur-3xl rounded-full" />
          
          <div className="relative z-10 w-[320px] h-[650px]">
            <div className="w-full h-full relative">
              {screens.map((src, idx) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: currentScreen === idx ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={src}
                    alt={`Screen ${idx}`}
                    fill
                    className="object-contain"
                    sizes="md"
                  />
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Floating badges for extra flair */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-4 top-1/4 glass-panel p-4 z-20 hidden xl:block"
          >
            <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Sales Today</p>
            <p className="text-xl font-mono text-primary-green">Ksh 14,850</p>
          </motion.div>
          
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -left-8 bottom-1/4 glass-panel p-4 z-20 hidden xl:block border-glow"
          >
            <p className="text-xs text-text-muted uppercase tracking-widest mb-1">AI Coach</p>
            <p className="text-sm font-medium">"Restock Chick Mash now"</p>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-widest text-text-muted">Scroll</span>
        <div className="w-[1px] h-12 bg-border relative overflow-hidden">
          <motion.div
            animate={{ y: [0, 48, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-0 left-0 w-full h-1/3 bg-primary-green"
          />
        </div>
      </motion.div>
    </section>
  );
};

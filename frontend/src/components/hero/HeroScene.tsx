"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Icosahedron, MeshDistortMaterial, Float } from '@react-three/drei';
import { useScroll, useTransform, useReducedMotion, motion } from 'framer-motion';
import * as THREE from 'three';

// Create a motion-enhanced version of MeshDistortMaterial
const MotionMeshDistortMaterial = motion(MeshDistortMaterial);

function MorphingMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { scrollYProgress } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  
  // On scroll, the displacement amplitude increases (§1.6 Option A)
  const distortAmount = useTransform(scrollYProgress, [0, 0.3], [0.45, 0.8]);

  useFrame((state, delta) => {
    if (!meshRef.current || prefersReducedMotion) return;
    
    // Delta-corrected rotation (§1.6)
    meshRef.current.rotation.y += 0.003 * (delta * 60);
    meshRef.current.rotation.z += 0.001 * (delta * 60);
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <Icosahedron ref={meshRef} args={[1, 4]} scale={2}>
        <MotionMeshDistortMaterial
          color="#F59E0B"
          speed={2}
          // @ts-ignore - Motion props
          distort={distortAmount} 
          radius={1}
          roughness={0.2}
          metalness={0.8}
          emissive="#F59E0B"
          emissiveIntensity={0.05}
        />
      </Icosahedron>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <div 
      className="w-full h-full relative"
      role="img" 
      aria-label="Abstract 3D mesh representing financial data flow" // §6 Accessibility
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        dpr={[1, 2]} // §5 Performance cap at 2
        gl={{ 
          alpha: true, 
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[2, 3, 2]} intensity={2} color="#F59E0B" />
        <MorphingMesh />
      </Canvas>
    </div>
  );
}

'use client';

import { motion, useMotionTemplate, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useRef, useEffect } from 'react';

export default function LandingPage() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for 3D tilt
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useMotionValue(0), springConfig);
  const rotateY = useSpring(useMotionValue(0), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate rotation limits (-5deg to 5deg)
    const rotateXValue = ((e.clientY - centerY) / (rect.height / 2)) * -5;
    const rotateYValue = ((e.clientX - centerX) / (rect.width / 2)) * 5;
    
    rotateX.set(rotateXValue);
    rotateY.set(rotateYValue);
  };

  const handleMouseLeave = () => {
    if (prefersReducedMotion) return;
    rotateX.set(0);
    rotateY.set(0);
  };

  // Staggered entrance animations
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
  };

  return (
    <div className="min-h-screen bg-[#060611] text-white overflow-hidden relative selection:bg-indigo-500/30">
      {/* Background Cinematic Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-900/10 blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-900/10 blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-8 pb-32">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-24">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center font-bold text-xl">
              L
            </div>
            <span className="text-xl font-bold tracking-tight">LOOP</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Meet the future of product feedback
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400">
            Turn customer feedback into <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">product intelligence.</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
            Automatically classify, analyze, and extract actionable insights from your user feedback in real-time. Built for teams that move fast.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(99,102,241,0.3)] flex items-center gap-2"
            >
              Start analyzing for free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              View live demo
            </Link>
          </motion.div>
        </motion.div>

        {/* 3D Dashboard Mockup Hero */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
          className="relative w-full max-w-6xl mx-auto [perspective:1000px]"
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <motion.div
            style={prefersReducedMotion ? {} : { rotateX, rotateY }}
            className="w-full relative rounded-2xl md:rounded-3xl border border-white/10 bg-[#0B0B1A]/80 backdrop-blur-2xl shadow-2xl overflow-hidden will-change-transform"
          >
            {/* Top Bar Mockup */}
            <div className="h-12 border-b border-white/10 flex items-center px-6 gap-2 bg-white/[0.02]">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="ml-4 h-5 w-48 bg-white/5 rounded-md" />
            </div>
            
            {/* Content Mockup */}
            <div className="p-8 flex flex-col gap-6 opacity-70">
              <div className="flex gap-6">
                <div className="flex-1 h-32 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-xl" />
                <div className="flex-1 h-32 bg-white/5 border border-white/5 rounded-xl" />
                <div className="flex-1 h-32 bg-white/5 border border-white/5 rounded-xl" />
              </div>
              <div className="flex gap-6">
                <div className="w-2/3 h-64 bg-white/5 border border-white/5 rounded-xl" />
                <div className="w-1/3 h-64 bg-white/5 border border-white/5 rounded-xl" />
              </div>
            </div>

            {/* Simulated Glow effect that follows mouse - only if motion is allowed */}
            {!prefersReducedMotion && (
              <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-50 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10" />
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

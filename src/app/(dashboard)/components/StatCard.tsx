'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  icon?: React.ReactNode;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)]"
    >
      {/* Subtle top glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 font-medium text-sm tracking-wide uppercase">{title}</h3>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <AnimatedCounter value={value} className="text-4xl font-bold text-white tracking-tight" />
        {subtitle && <span className="text-sm font-medium text-gray-400">{subtitle}</span>}
      </div>
    </motion.div>
  );
}

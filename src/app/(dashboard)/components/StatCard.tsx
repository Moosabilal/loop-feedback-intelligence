'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  delay?: number;
}

export function StatCard({ title, value, subtitle, icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors group relative overflow-hidden"
    >
      {/* Subtle top glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 font-medium text-sm tracking-wide uppercase">{title}</h3>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
        {subtitle && <span className="text-sm font-medium text-gray-400">{subtitle}</span>}
      </div>
    </motion.div>
  );
}

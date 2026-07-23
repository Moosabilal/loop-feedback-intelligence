'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number | string;
  className?: string;
  delay?: number;
}

export function AnimatedCounter({ value, className = '', delay = 0 }: AnimatedCounterProps) {
  const [mounted, setMounted] = useState(false);
  const count = useMotionValue(0);

  // Extract numeric part and suffix (e.g., "40%" -> num: 40, suffix: "%")
  const numericValue =
    typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^0-9.-]+/g, '')) || 0;
  const suffix = typeof value === 'string' ? value.replace(/[0-9.-]+/g, '') : '';

  const rounded = useTransform(count, (latest) => {
    // Determine decimal places based on original numeric string
    const decimalPlaces = numericValue.toString().split('.')[1]?.length || 0;
    const formattedNum = Number(latest).toFixed(decimalPlaces);
    return `${formattedNum}${suffix}`;
  });

  useEffect(() => {
    setMounted(true);
    const controls = animate(count, numericValue, {
      duration: 1.5,
      delay,
      ease: [0.22, 1, 0.36, 1], // easeOutQuint
    });
    return controls.stop;
  }, [numericValue, count, delay]);

  // Prevent hydration mismatch by just rendering the static value on the server
  if (!mounted) {
    return <span className={className}>{value}</span>;
  }

  return <motion.span className={className}>{rounded}</motion.span>;
}

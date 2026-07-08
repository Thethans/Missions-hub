import React from 'react';
import { motion } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

export default function RevealOnScroll({ children, index = 0, className }) {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: prefersReduced ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {children}
    </motion.div>
  );
}

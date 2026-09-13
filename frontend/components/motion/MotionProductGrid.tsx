'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard, { Product } from '@/components/ProductCard';

interface MotionProductGridProps {
  products: Product[];
  className?: string;
  renderItem?: (product: Product) => React.ReactNode;
}

export default function MotionProductGrid({
  products,
  className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6',
  renderItem,
}: MotionProductGridProps) {
  return (
    <motion.div layout className={className}>
      <AnimatePresence mode="popLayout">
        {products.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              layout: { duration: 0.25, ease: 'easeOut' },
              opacity: { duration: 0.2 },
            }}
            className="h-full"
          >
            {renderItem ? renderItem(product) : <ProductCard product={product} />}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/ui/ProductCard';
import { SectionHeader } from './FeaturedCategories';
import { FEATURED_PRODUCTS, BESTSELLER_PRODUCTS, NEW_ARRIVALS, TRENDING_PRODUCTS } from '@/lib/data/products';
import type { Product } from '@/types';

// ─── Stagger wrapper ──────────────────────────────────────────────────────────
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 },
  },
};
const cardItem = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

// ─── Reusable Product Grid Section ───────────────────────────────────────────
interface ProductGridSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  cta?: string;
  ctaHref?: string;
  products: Product[];
  bgAlt?: boolean;
  variant?: 'default' | 'compact';
  columns?: 2 | 3 | 4 | 5;
  maxItems?: number;
}

export function ProductGridSection({
  id,
  eyebrow,
  title,
  subtitle,
  cta,
  ctaHref = '#',
  products,
  bgAlt = false,
  variant = 'default',
  columns = 4,
  maxItems = 8,
}: ProductGridSectionProps) {
  const displayed = products.slice(0, maxItems);

  const colClass =
    columns === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    columns === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
    columns === 5 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <section
      id={id}
      className={bgAlt ? 'py-16 bg-[var(--background-alt)]' : 'py-16 bg-[var(--background)]'}
      aria-label={title}
    >
      <div className="container-fluid">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          cta={cta}
          ctaHref={ctaHref}
        />

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className={`grid ${colClass} gap-5`}
        >
          {displayed.map((product) => (
            <motion.div key={product.id} variants={cardItem}>
              <ProductCard
                product={product}
                variant={variant}
                showCompare
                showQuickView
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Featured Products ────────────────────────────────────────────────────────
export function FeaturedProducts() {
  return (
    <ProductGridSection
      id="featured-products"
      eyebrow="Handpicked"
      title="Featured Products"
      subtitle="Our engineers' top picks — quality components tested and trusted by the maker community."
      cta="View All Products"
      ctaHref="/products"
      products={FEATURED_PRODUCTS.length >= 4 ? FEATURED_PRODUCTS : TRENDING_PRODUCTS}
      bgAlt={false}
      columns={4}
      maxItems={8}
    />
  );
}

// ─── Best Sellers ─────────────────────────────────────────────────────────────
export function BestSellers() {
  return (
    <ProductGridSection
      id="best-sellers"
      eyebrow="Most Popular"
      title="Best Sellers"
      subtitle="The community's most loved products — consistently high-rated and in demand."
      cta="See All Bestsellers"
      ctaHref="/products?sort=bestseller"
      products={BESTSELLER_PRODUCTS.length >= 4 ? BESTSELLER_PRODUCTS : TRENDING_PRODUCTS}
      bgAlt
      columns={4}
      maxItems={8}
    />
  );
}

// ─── New Arrivals ─────────────────────────────────────────────────────────────
export function NewArrivals() {
  return (
    <ProductGridSection
      id="new-arrivals"
      eyebrow="Just Landed"
      title="New Arrivals"
      subtitle="Fresh stock alert! The latest boards, modules, and kits added to our inventory."
      cta="See All New Products"
      ctaHref="/products?sort=newest"
      products={NEW_ARRIVALS.length >= 4 ? NEW_ARRIVALS : TRENDING_PRODUCTS}
      bgAlt={false}
      columns={4}
      maxItems={8}
    />
  );
}

// ─── Trending Products ────────────────────────────────────────────────────────
export function TrendingProducts() {
  return (
    <ProductGridSection
      id="trending"
      eyebrow="Hot Right Now"
      title="Trending Products"
      subtitle="What makers across India are buying this week — from budget beginner boards to pro modules."
      cta="View All Trending"
      ctaHref="/products?sort=trending"
      products={TRENDING_PRODUCTS}
      bgAlt
      columns={4}
      maxItems={8}
    />
  );
}

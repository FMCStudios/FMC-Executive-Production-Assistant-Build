'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { type Brand, brands } from '@/lib/brands';

type BrandContextType = {
  activeBrand: Brand;
  setBrand: (id: string) => void;
  brandId: string;
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brandId, setBrandId] = useState('fmc');
  const activeBrand = brands[brandId];

  return (
    <BrandContext.Provider value={{ activeBrand, setBrand: setBrandId, brandId }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error('useBrand must be used within BrandProvider');
  return ctx;
}

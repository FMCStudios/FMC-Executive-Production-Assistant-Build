'use client';

import { useBrand } from '@/context/BrandContext';
import { brandsList } from '@/lib/brands';

export default function BrandSelector() {
  const { brandId, setBrand } = useBrand();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {brandsList.map((brand) => {
        const isActive = brandId === brand.id;
        return (
          <button
            key={brand.id}
            onClick={() => setBrand(brand.id)}
            className="glass-panel p-5 text-left cursor-pointer active:scale-[0.97]"
            style={{
              borderColor: isActive ? `${brand.accentColor}50` : undefined,
              boxShadow: isActive ? `0 0 20px ${brand.accentColor}20` : undefined,
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{
                  background: brand.accentColor,
                  boxShadow: isActive ? `0 0 8px ${brand.accentColor}60` : 'none',
                  transition: 'box-shadow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />
              <span className="text-sm font-semibold text-fmc-offwhite">
                {brand.name}
              </span>
            </div>
            <p className="text-xs text-white/40">{brand.tagline}</p>
          </button>
        );
      })}
    </div>
  );
}

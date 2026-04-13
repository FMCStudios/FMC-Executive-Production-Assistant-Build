export type Brand = {
  id: string;
  name: string;
  tagline: string;
  voice: string;
  services: string;
  sctFraming: string;
  accentColor: string;
  briefToneInstruction: string;
};

import { fmcBrand } from './fmc';
import { tourbusBrand } from './tourbus';
import { oakAndCiderBrand } from './oakandcider';

export const brands: Record<string, Brand> = {
  fmc: fmcBrand,
  tourbus: tourbusBrand,
  oakandcider: oakAndCiderBrand,
};

export const brandsList: Brand[] = [fmcBrand, tourbusBrand, oakAndCiderBrand];

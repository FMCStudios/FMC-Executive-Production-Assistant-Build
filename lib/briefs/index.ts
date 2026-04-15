import type { BriefTypeConfig } from '@/types/brief-schema';

import { leadIntake } from './lead-intake';
import { discovery } from './discovery';
import { production } from './production';
import { postProduction } from './post-production';
import { wrapRetention } from './wrap-retention';
import { archive } from './archive';

export type BriefType = BriefTypeConfig;

export const briefTypes: Record<string, BriefTypeConfig> = {
  'lead-intake': leadIntake,
  'discovery': discovery,
  'production': production,
  'post-production': postProduction,
  'wrap-retention': wrapRetention,
  'archive': archive,
};

export const briefTypesList: BriefTypeConfig[] = [
  leadIntake,
  discovery,
  production,
  postProduction,
  wrapRetention,
  archive,
];

export type BriefType = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  placeholder: string;
  systemPrompt: string;
};

import { leadIntake } from './lead-intake';
import { discovery } from './discovery';
import { production } from './production';
import { postProduction } from './post-production';
import { wrapRetention } from './wrap-retention';
import { archive } from './archive';

export const briefTypes: Record<string, BriefType> = {
  'lead-intake': leadIntake,
  'discovery': discovery,
  'production': production,
  'post-production': postProduction,
  'wrap-retention': wrapRetention,
  'archive': archive,
};

export const briefTypesList: BriefType[] = [
  leadIntake,
  discovery,
  production,
  postProduction,
  wrapRetention,
  archive,
];

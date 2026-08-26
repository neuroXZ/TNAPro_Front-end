// Per-deployment feature flags — public/unauthenticated, mirrors the backend's
// FEATURE_* env vars (see backend/src/config/features.ts). Used to hide
// optional features (e.g. Zon/Negeri, built for the NIISe JAP government
// deployment) on every other TNAPro deployment sharing this same codebase.
import { cachedGet } from './cache';

export interface FeatureFlags {
  zonNegeri: boolean;
  unitScopedCompetency: boolean;
}

export const featuresAPI = {
  getAll: async (): Promise<FeatureFlags> => cachedGet<FeatureFlags>('/public/features'),
};

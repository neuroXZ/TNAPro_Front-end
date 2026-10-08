// Base mapping template (backend: src/modules/mappingTemplate, plan:
// docs/MAPPING_TEMPLATE_PLAN.md). Admin only. Nothing here is cached: the
// template page and the Manage page must always show the current state.
import { api } from './client';
import { invalidateApiCache } from './cache';

export type TemplateCoverage = 'ALL_POSITIONS' | 'CATEGORIES' | 'MANUAL';

export interface TemplateRuleInput {
  clusterId: string;
  coverage: TemplateCoverage;
  defaultLevel?: number | null;
  isActive?: boolean;
  levels: { categoryId: string; level: number }[];
}

export interface MappingTemplateState {
  rules: TemplateRuleInput[];
  clusters: { id: string; name: string | null; color: string | null; level: number | null; _count: { Competency: number } }[];
  categories: { id: string; name: string | null; _count: { Position: number } }[];
  positionsWithoutCategory: { id: string; name: string | null }[];
  stats: { templateRows: number; exclusions: number };
}

export interface TemplatePlanSummary {
  create: number;
  updateLevel: number;
  adopt: number;
  remove: number;
  manualOverrides: number;
  excluded: number;
  noLevel: number;
}

type PairRow = { positionId: string; competencyId: string };
export interface TemplatePlanResult {
  summary: TemplatePlanSummary;
  plan: {
    create: (PairRow & { level: number })[];
    updateLevel: (PairRow & { id: string; from: number | null; to: number })[];
    adopt: (PairRow & { id: string; level: number })[];
    remove: (PairRow & { id: string; level: number | null })[];
    manualOverrides: (PairRow & { id: string; level: number | null; templateLevel: number })[];
    excluded: (PairRow & { templateLevel: number })[];
    noLevel: { positionId: string; clusterId: string }[];
  };
  positions: Record<string, { name: string | null; categoryId: string | null }>;
  competencies: Record<string, { name: string | null; clusterId: string | null }>;
}

export interface TemplateSuggestion {
  clusterId: string;
  clusterName: string | null;
  competencyCount: number;
  stats: { categoryId: string; categoryName: string | null; mapped: number; possible: number; ratio: number; commonLevel: number | null }[];
  rule: TemplateRuleInput | null;
}

export interface TemplateExclusion {
  id: string;
  positionId: string;
  competencyId: string;
  createdAt: string;
  position: { id: string; name: string | null };
  competency: { id: string; name: string | null; clusterId: string | null };
}

export const mappingTemplateAPI = {
  get: async (): Promise<MappingTemplateState> => (await api.get('/mappingtemplate')).data,

  suggest: async (): Promise<{ suggestions: TemplateSuggestion[]; positionsWithoutCategory: number }> =>
    (await api.get('/mappingtemplate/suggest')).data,

  preview: async (rules: TemplateRuleInput[], adoptMatchingManual: boolean): Promise<TemplatePlanResult> =>
    (await api.post('/mappingtemplate/preview', { rules, adoptMatchingManual })).data,

  apply: async (rules: TemplateRuleInput[], adoptMatchingManual: boolean): Promise<TemplatePlanResult> => {
    const response = await api.post('/mappingtemplate/apply', { rules, adoptMatchingManual });
    invalidateApiCache('/positioncompetency');
    return response.data;
  },

  reset: async (positionId: string, competencyId: string): Promise<{ level: number }> => {
    const response = await api.post('/mappingtemplate/reset', { positionId, competencyId });
    invalidateApiCache('/positioncompetency');
    return response.data;
  },

  exclusions: async (): Promise<TemplateExclusion[]> => (await api.get('/mappingtemplate/exclusions')).data,
};

/**
 * Level the template gives a competency of `clusterId` on a position of
 * `categoryId`, and whether the template generates that mapping itself
 * (covered) or only suggests the level (MANUAL coverage). Mirrors
 * levelForPosition() in the backend planner.
 */
export function templateLevelFor(
  rules: TemplateRuleInput[],
  clusterId: string | null | undefined,
  categoryId: string | null | undefined,
): { covered: boolean; level: number | null } {
  const rule = clusterId ? rules.find((r) => r.clusterId === clusterId) : undefined;
  if (!rule || rule.isActive === false) return { covered: false, level: null };
  const matrix = categoryId ? rule.levels.find((l) => l.categoryId === categoryId)?.level : undefined;
  if (rule.coverage === 'MANUAL') return { covered: false, level: matrix ?? null };
  if (rule.coverage === 'CATEGORIES') return matrix === undefined ? { covered: false, level: null } : { covered: true, level: matrix };
  return { covered: true, level: matrix ?? rule.defaultLevel ?? null };
}

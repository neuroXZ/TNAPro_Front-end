import { api } from './client';
import { cachedGet, invalidateApiCache } from './cache';
import { createCrudApi } from './crud-factory';

export const trainingAPI = createCrudApi('/training');

export interface PositionCompetencyDeleteImpact {
  results: number;
  submittedResults: number;
  removed: number;
  levelChanged: number;
  staff: number;
  assessments: string[];
}

export const competencyAPI = {
  ...createCrudApi('/competency'),

  // Competency dictionary: the competency (with cluster) plus its per-level
  // indicators, ordered by level then sortOrder. Reference only.
  getDictionary: <T = unknown>(id: string) => cachedGet<T>(`/competency/${id}/dictionary`),

  // Replaces the full indicator set; array order within a level is kept.
  replaceIndicators: async (id: string, indicators: { level: number; text: string }[]) => {
    const response = await api.put(`/competency/${id}/indicators`, { indicators });
    invalidateApiCache('/competency');
    return response.data;
  },
};

export const positionCompetencyAPI = {
  ...createCrudApi('/positioncompetency'),

  // Read-only: how many recorded results removing these mapping rows would
  // affect (drop out of CGA/IDP, or be re-scored against another RCL).
  getDeleteImpact: async (ids: string[]): Promise<PositionCompetencyDeleteImpact> => {
    const response = await api.post('/positioncompetency/delete-impact', { ids });
    return response.data;
  },

  getByPosition: async (positionId: string) => {
    const data = await cachedGet<any[]>('/positioncompetency');
    return data.filter((pc: any) => pc.positionId === positionId);
  },

  // Raw rows for one exact scope (not resolved/inherited) - what the admin
  // mapping editor needs: "does this position have its own mapping for this
  // unit (or org-wide, when unitId is null)", as opposed to getEffective's
  // "what applies to a staff member here after resolving inheritance".
  getByPositionAndUnit: async (positionId: string, unitId: string | null) => {
    const data = await cachedGet<any[]>('/positioncompetency');
    return data.filter((pc: any) => pc.positionId === positionId && (pc.unitId ?? null) === unitId);
  },

  // Resolves to one row per required competency, honoring unit-scoped
  // mappings when unitId is supplied (a scoped mapping for that unit or an
  // ancestor of it wins over an org-wide one for the same competency).
  getEffective: async (positionId: string, unitId?: string | null) => {
    const params = new URLSearchParams({ positionId });
    if (unitId) params.set('unitId', unitId);
    return cachedGet<any[]>(`/positioncompetency/effective?${params.toString()}`);
  },
};

export const trainingCompetencyAPI = {
  ...createCrudApi('/trainingcompetency'),

  getByTraining: async (trainingId: string) => {
    const data = await cachedGet<any[]>('/trainingcompetency');
    return data.filter((tc: any) => tc.trainingId === trainingId);
  },
};

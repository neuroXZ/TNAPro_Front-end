import { cachedGet } from './cache';
import { createCrudApi } from './crud-factory';

export const trainingAPI = createCrudApi('/training');
export const competencyAPI = createCrudApi('/competency');

export const positionCompetencyAPI = {
  ...createCrudApi('/positioncompetency'),

  getByPosition: async (positionId: string) => {
    const data = await cachedGet<any[]>('/positioncompetency');
    return data.filter((pc: any) => pc.positionId === positionId);
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

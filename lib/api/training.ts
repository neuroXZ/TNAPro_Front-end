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
};

export const trainingCompetencyAPI = {
  ...createCrudApi('/trainingcompetency'),

  getByTraining: async (trainingId: string) => {
    const data = await cachedGet<any[]>('/trainingcompetency');
    return data.filter((tc: any) => tc.trainingId === trainingId);
  },
};

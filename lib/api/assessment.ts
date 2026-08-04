import { cachedGet } from './cache';
import { createCrudApi } from './crud-factory';

export const assessmentAPI = createCrudApi('/assessment');

export const assessmentResultAPI = {
  ...createCrudApi('/assessmentresult'),

  getByAssessment: async (assessmentId: string) => {
    const data = await cachedGet<any[]>('/assessmentresult');
    return data.filter((result: any) => result.assessmentId === assessmentId);
  },
};

import { api } from './client';
import { cachedGet } from './cache';
import { createCrudApi } from './crud-factory';

export const assessmentAPI = createCrudApi('/assessment');

export type SelfResultVisibility = 'OFF' | 'AFTER_SUPERIOR_SUBMIT' | 'ALWAYS';

export interface SubordinateSelfResults {
  visibility: SelfResultVisibility;
  available: boolean;
  reason?: 'PENDING_SUPERIOR_SUBMIT' | 'SELF_NOT_SUBMITTED';
  results: { competencyId: string | null; score: number | null }[];
}

export const assessmentResultAPI = {
  ...createCrudApi('/assessmentresult'),

  getByAssessment: async (assessmentId: string) => {
    const data = await cachedGet<any[]>('/assessmentresult');
    return data.filter((result: any) => result.assessmentId === assessmentId);
  },

  // Superior's read-only view of a subordinate's submitted self scores.
  // Not cached: availability changes the moment the superior submits.
  getSubordinateSelf: async (staffId: string, assessmentId: string): Promise<SubordinateSelfResults> => {
    const params = new URLSearchParams({ staffId, assessmentId });
    const response = await api.get(`/assessmentresult/subordinate-self?${params.toString()}`);
    return response.data;
  },
};

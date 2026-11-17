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

export interface SubordinateSelfStatus {
  // false while the client's "notify superior on self-assessment submit" setting is off.
  enabled: boolean;
  submittedStaffIds: string[];
}

export const superiorSubmitNoticeAPI = {
  // Which of the caller's own subordinates have submitted their self-assessment (status only, no scores).
  // Not cached: it changes as staff submit.
  getSubordinateStatus: async (assessmentId: string): Promise<SubordinateSelfStatus> => {
    const params = new URLSearchParams({ assessmentId });
    const response = await api.get(`/superior-submit-notice/subordinate-status?${params.toString()}`);
    return response.data;
  },
};

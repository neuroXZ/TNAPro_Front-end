// Org-structure / HR master data — plain CRUD resources (assessor has two extras).
import { createCrudApi } from './crud-factory';
import { api } from './client';
import { invalidateApiCache } from './cache';

export const adminAPI = createCrudApi('/admin');
export const positionAPI = createCrudApi('/position');
export const positionCategoryAPI = createCrudApi('/positioncategory');
export const unitAPI = createCrudApi('/unit');
export const unitTypeAPI = createCrudApi('/unittype');
export const clusterAPI = createCrudApi('/cluster');
export const zonAPI = createCrudApi('/zon');
export const negeriAPI = createCrudApi('/negeri');
export const modulAPI = createCrudApi('/modul');
export const gradeAPI = createCrudApi('/grade');
export const levelAPI = createCrudApi('/level');
export const assessorAPI = {
  ...createCrudApi('/assessor'),

  // Every assessor row of one staff member, with how many results each has.
  getForStaff: async (staffId: string) => {
    const response = await api.get(`/assessor/staff/${staffId}`);
    return response.data;
  },

  // Make the staff member's superior assessors exactly this list. Rows that
  // already have results are kept (returned in `kept`); a missing self row
  // is created.
  setSuperiors: async (staffId: string, assessorIds: string[]) => {
    const response = await api.put(`/assessor/staff/${staffId}/superiors`, { assessorIds });
    invalidateApiCache('/assessor');
    return response.data;
  },
};

// Org-structure / HR master data — plain CRUD resources, no extra endpoints.
import { createCrudApi } from './crud-factory';

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
export const assessorAPI = createCrudApi('/assessor');

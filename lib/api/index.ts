// Barrel file — every resource API is re-exported from here so the rest of
// the app can keep doing `import { staffAPI } from '@/lib/api'` regardless
// of which file inside lib/api/ it actually lives in.
//
// Where to find what:
//   client.ts        - axios instance + interceptors (auth token, 401 redirect, logging)
//   cache.ts          - in-memory GET cache (cachedGet, invalidateApiCache)
//   crud-factory.ts   - createCrudApi() — shared getAll/getById/create/update/delete
//   auth.ts           - login, profile, forgot/reset password
//   staff.ts          - staff CRUD + import/export/photo upload
//   organization.ts   - admin, position, unit, grade, level, assessor, cluster, etc.
//   training.ts       - training, competency, position/training-competency mapping
//   assessment.ts     - assessment, assessment results
//   settings.ts       - system settings + logo upload
//   reports.ts        - IDP, CGA, RTN, dashboard, comparisons, training demand
//   misc.ts           - mail, contact email, bulk import
//   developmentStrategy.ts - client-configurable IDP development strategies
export { api, default } from './client';
export { invalidateApiCache } from './cache';
export { createCrudApi } from './crud-factory';

export * from './auth';
export * from './staff';
export * from './organization';
export * from './training';
export * from './assessment';
export * from './settings';
export * from './reports';
export * from './misc';
export * from './developmentStrategy';

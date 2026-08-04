import { api } from './client';
import { cachedGet, invalidateApiCache } from './cache';

/**
 * Most resources in this API share the same 5 endpoints: list, read one,
 * create, update, delete. Use this instead of hand-writing those 5 methods
 * again — only write a dedicated resource file when it needs endpoints
 * beyond these (see staff.ts, settings.ts for examples).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createCrudApi<T = any>(basePath: string) {
  return {
    getAll: () => cachedGet<T[]>(basePath),

    getById: (id: string) => cachedGet<T>(`${basePath}/${id}`),

    create: async (data: any) => {
      const response = await api.post(basePath, data);
      invalidateApiCache(basePath);
      return response.data;
    },

    update: async (id: string, data: any) => {
      const response = await api.put(`${basePath}/${id}`, data);
      invalidateApiCache(basePath);
      return response.data;
    },

    delete: async (id: string) => {
      const response = await api.delete(`${basePath}/${id}`);
      invalidateApiCache(basePath);
      return response.data;
    },
  };
}

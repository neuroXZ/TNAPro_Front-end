import { api } from './client';
import { cachedGet, invalidateApiCache } from './cache';
import { createCrudApi } from './crud-factory';

export const settingAPI = {
  ...createCrudApi('/setting'),

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post('/setting/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    invalidateApiCache('/setting');
    return response.data;
  },

  // Public API - no auth required
  getPublicLogo: async () => {
    return cachedGet('/public/setting/logo');
  },
};

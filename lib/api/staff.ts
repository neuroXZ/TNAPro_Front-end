import { api } from './client';
import { invalidateApiCache } from './cache';
import { createCrudApi } from './crud-factory';

export const staffAPI = {
  ...createCrudApi('/staff'),

  import: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/staff/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    invalidateApiCache('/staff');
    return response.data;
  },

  export: async () => {
    const response = await api.get('/staff/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  sendNotification: async (staffIds: string[], title: string, appBaseUrl?: string) => {
    const response = await api.post('/staff/notify', { staffIds, title, appBaseUrl });
    return response.data;
  },

  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await api.post('/staff/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    invalidateApiCache('/staff');
    return response.data;
  },
};

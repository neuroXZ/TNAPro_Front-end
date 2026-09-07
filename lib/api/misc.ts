import { api } from './client';
import { invalidateApiCache } from './cache';
import { createCrudApi } from './crud-factory';

export const mailAPI = {
  ...createCrudApi('/mail'),

  getTemplateVariables: async (mailType: string): Promise<{ mailType: string; variables: Array<{ key: string; description: string }> }> => {
    const response = await api.get('/mail/template-variables', { params: { mailType } });
    return response.data;
  },
};

export const emailAPI = {
  sendContactMessage: async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    const response = await api.post('/email/contact', data);
    return response.data;
  },
};

export const importAPI = {
  downloadTemplate: async (modelType: 'staff' | 'position' | 'grade' | 'competency' | 'training') => {
    const response = await api.get(`/import/template/${modelType}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  import: async (modelType: 'staff' | 'position' | 'grade' | 'competency' | 'training', file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/import/${modelType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    invalidateApiCache();
    return response.data;
  },
};

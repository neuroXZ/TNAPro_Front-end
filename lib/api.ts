import axios from 'axios';

// API Base URL
const API_BASE_URL = 'https://mmcsb-tnapro-postgres2-production.up.railway.app/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: { username: string; password: string; userType: 'staff' | 'admin' }) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Staff API
export const staffAPI = {
  getAll: async () => {
    const response = await api.get('/staff');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/staff/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/staff', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/staff/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/staff/${id}`);
    return response.data;
  },
  
  import: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/staff/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  export: async () => {
    const response = await api.get('/staff/export', {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Position API
export const positionAPI = {
  getAll: async () => {
    const response = await api.get('/position');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/position/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/position', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/position/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/position/${id}`);
    return response.data;
  },
};

// Unit API
export const unitAPI = {
  getAll: async () => {
    const response = await api.get('/unit');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/unit/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/unit', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/unit/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/unit/${id}`);
    return response.data;
  },
};

// UnitType API
export const unitTypeAPI = {
  getAll: async () => {
    const response = await api.get('/unittype');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/unittype/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/unittype', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/unittype/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/unittype/${id}`);
    return response.data;
  },
};

// Grade API
export const gradeAPI = {
  getAll: async () => {
    const response = await api.get('/grade');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/grade/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/grade', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/grade/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/grade/${id}`);
    return response.data;
  },
};

// Level API
export const levelAPI = {
  getAll: async () => {
    const response = await api.get('/level');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/level/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/level', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/level/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/level/${id}`);
    return response.data;
  },
};

// Assessor API
export const assessorAPI = {
  getAll: async () => {
    const response = await api.get('/assessor');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/assessor/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/assessor', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/assessor/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/assessor/${id}`);
    return response.data;
  },
};

// Cluster API
export const clusterAPI = {
  getAll: async () => {
    const response = await api.get('/cluster');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/cluster/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/cluster', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/cluster/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/cluster/${id}`);
    return response.data;
  },
};

// Training API
export const trainingAPI = {
  getAll: async () => {
    const response = await api.get('/training');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/training/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/training', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/training/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/training/${id}`);
    return response.data;
  },
};

// Competency API
export const competencyAPI = {
  getAll: async () => {
    const response = await api.get('/competency');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/competency/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/competency', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/competency/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/competency/${id}`);
    return response.data;
  },
};

// Mail API
export const mailAPI = {
  getAll: async () => {
    const response = await api.get('/mail');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/mail/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/mail', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/mail/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/mail/${id}`);
    return response.data;
  },
};

// Position Competency API
export const positionCompetencyAPI = {
  getAll: async () => {
    const response = await api.get('/positioncompetency');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/positioncompetency/${id}`);
    return response.data;
  },
  
  getByPosition: async (positionId: string) => {
    const response = await api.get('/positioncompetency');
    const data = response.data;
    return data.filter((pc: any) => pc.positionId === positionId);
  },
  
  create: async (data: any) => {
    const response = await api.post('/positioncompetency', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/positioncompetency/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/positioncompetency/${id}`);
    return response.data;
  },
};

// Training Competency API
export const trainingCompetencyAPI = {
  getAll: async () => {
    const response = await api.get('/trainingcompetency');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/trainingcompetency/${id}`);
    return response.data;
  },
  
  getByTraining: async (trainingId: string) => {
    const response = await api.get('/trainingcompetency');
    const data = response.data;
    return data.filter((tc: any) => tc.trainingId === trainingId);
  },
  
  create: async (data: any) => {
    const response = await api.post('/trainingcompetency', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/trainingcompetency/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/trainingcompetency/${id}`);
    return response.data;
  },
};

// Setting API
export const settingAPI = {
  getAll: async () => {
    const response = await api.get('/setting');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/setting/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/setting', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/setting/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/setting/${id}`);
    return response.data;
  },
};

// Assessment API
export const assessmentAPI = {
  getAll: async () => {
    const response = await api.get('/assessment');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/assessment/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/assessment', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/assessment/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/assessment/${id}`);
    return response.data;
  },
};

// Assessment Result API
export const assessmentResultAPI = {
  getAll: async () => {
    const response = await api.get('/assessmentresult');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/assessmentresult/${id}`);
    return response.data;
  },
  
  getByAssessment: async (assessmentId: string) => {
    const response = await api.get('/assessmentresult');
    const data = response.data;
    return data.filter((result: any) => result.assessmentId === assessmentId);
  },
  
  create: async (data: any) => {
    const response = await api.post('/assessmentresult', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/assessmentresult/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/assessmentresult/${id}`);
    return response.data;
  },
};

// IDP API
export const idpAPI = {
  generate: async (data: { staffId: string; assessmentId?: string }) => {
    const response = await api.post('/idp/generate', data);
    return response.data;
  },
};

export default api;

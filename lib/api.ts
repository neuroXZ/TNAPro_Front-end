import axios from 'axios';

// API Base URL - Use environment variable or fallback to production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for slow Server responses
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - Backend server may not be running');
    } else if (error.response?.status === 404) {
      console.error('404 Not Found - API endpoint may not exist:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

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

  forgotPassword: async (data: { identifier: string; userType: 'staff' | 'admin'; appBaseUrl: string }) => {
    console.log('🔐 FORGOT PASSWORD REQUEST STARTING...');
    console.log('🌐 API Base URL:', API_BASE_URL);
    console.log('📡 Full Request URL:', `${API_BASE_URL}/auth/forgot-password`);
    console.log('📨 Request data:', data);
    
    // Retry mechanism for Server cold start
    const maxRetries = 2;
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Attempt ${attempt}/${maxRetries}: Sending request to server...`);
        
        const response = await api.post('/auth/forgot-password', data, {
          timeout: 60000, // 60 seconds for this specific request
        })
        
        console.log('✅ SUCCESS! Response:', response);
        return response;
      } catch (error: any) {
        lastError = error;
        console.log(`❌ ATTEMPT ${attempt} FAILED!`);
        console.log('❌ Error type:', error.name);
        console.log('❌ Error message:', error.message);
        console.log('❌ Error code:', error.code);
        console.log('❌ Response status:', error.response?.status);
        console.log('❌ Response data:', error.response);
        
        // If it's a timeout and we have retries left, continue
        if (error.message?.includes('timeout') && attempt < maxRetries) {
          console.log(`⏳ Timeout on attempt ${attempt}, retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        
        // If it's not a timeout error, don't retry
        if (!error.message?.includes('timeout')) {
          break;
        }
      }
    }
    
    // Handle final error after all retries
    if (lastError.code === 'ECONNREFUSED' || lastError.code === 'NETWORK_ERROR') {
      throw new Error('Cannot connect to server. Please check your network connection.');
    } else if (lastError.message?.includes('timeout')) {
      throw new Error('Server is slow to respond. This may be due to cold start. Please wait a moment and try again.');
    } else if (lastError.response?.status === 404) {
      throw new Error('Forgot password endpoint not found on the server.');
    } else if (lastError.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw lastError;
  },

  resetPassword: async (data: { token: string; userType: 'staff' | 'admin'; newPassword: string }) => {
    console.log('🔐 RESET PASSWORD REQUEST STARTING...');
    console.log('📨 Request data:', { ...data, newPassword: '[HIDDEN]' });
    
    try {
      const response = await api.post('/auth/reset-password', data, {
        timeout: 60000, // 60 seconds for password reset
      });
      console.log('✅ RESET PASSWORD SUCCESS!', response.data);
      return response.data;
    } catch (error: any) {
      console.log('❌ RESET PASSWORD FAILED!');
      console.log('❌ Error:', error.response?.data || error.message);
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.error || 'Invalid request. Please check your input.');
      } else if (error.response?.status === 404) {
        throw new Error('Reset password endpoint not found.');
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('server timeout. Please wait a moment and try again.');
      }
      
      throw error;
    }
  },
};

// Admin API
export const adminAPI = {
  getAll: async () => {
    const response = await api.get('/admin');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/admin/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/admin', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/admin/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/admin/${id}`);
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

  uploadPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await api.post('/staff/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
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

// PositionCategory API
export const positionCategoryAPI = {
  getAll: async () => {
    const response = await api.get('/positioncategory');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/positioncategory/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/positioncategory', data);
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/positioncategory/${id}`, data);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/positioncategory/${id}`);
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

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);

    const response = await api.post('/setting/upload-logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Public API - no auth required
  getPublicLogo: async () => {
    const response = await api.get('/public/setting/logo');
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

  exportCsv: async (data: { staffId: string; assessmentId?: string }) => {
    const params = new URLSearchParams();
    params.append('staffId', data.staffId);
    if (data.assessmentId) {
      params.append('assessmentId', data.assessmentId);
    }

    const response = await api.get(`/idp/export-csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  },

  exportPdf: async (data: { staffId: string; assessmentId?: string }) => {
    const params = new URLSearchParams();
    params.append('staffId', data.staffId);
    if (data.assessmentId) {
      params.append('assessmentId', data.assessmentId);
    }

    const response = await api.get(`/idp/export-pdf/?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  },
};

// CGA (Competency Gap Analysis) API
export const cgaAPI = {
  exportCsv: async (data: { staffId: string; assessmentId: string }) => {
    const params = new URLSearchParams();
    params.append('staffId', data.staffId);
    params.append('assessmentId', data.assessmentId);

    const response = await api.get(`/cga/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  },
};



// Recommended Training (RTN) API
export const rtnAPI = {
  getReport: async (data: { staffId: string; assessmentId: string }) => {
    try {
      const response = await api.post('/recommendedtraining/report', data);
      return response.data;
    } catch (error: any) {
      // If 404, endpoint not available in deployment
      if (error.response?.status === 404) {
        console.warn("RTN endpoint not available, returning mock data");
        // Return empty response to trigger "no recommendations" flow
        return {
          staffId: data.staffId,
          staffName: null,
          positionName: null,
          assessmentId: data.assessmentId,
          results: [],
          generatedAt: new Date()
        };
      }
      throw error;
    }
  },
  export: async (data: { staffId: string; assessmentId: string }) => {
    const response = await api.post('/recommendedtraining/export', data, {
      responseType: 'blob'
    });
    return response;
  },
};

// Import API
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
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },
};

// Email API
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

// Competency Report API
export const competencyReportAPI = {
  getGapByGrade: async (assessmentId: string) => {
    const response = await api.get('/competencyreport/competency-gap-by-grade', {
      params: { assessmentId }
    });
    return response.data;
  },

  exportCsv: async (data: { assessmentId: string }) => {
    const params = new URLSearchParams();
    params.append('assessmentId', data.assessmentId);

    const response = await api.get(`/competencyreport/export-csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  },

  exportPdf: async (data: { assessmentId: string }) => {
    const params = new URLSearchParams();
    params.append('assessmentId', data.assessmentId);

    const response = await api.get(`/competencyreport/export-pdf/?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  },
};

// Training Demand API
export const trainingDemandAPI = {
  generateReport: async (assessmentId: string) => {
    const response = await api.get('/trainingdemand/demand', {
      params: { assessmentId }
    });
    return response.data;
  },

  exportCsv: async (assessmentId: string) => {
    const params = new URLSearchParams();
    params.append('assessmentId', assessmentId);

    const response = await api.get(`/trainingdemand/demand/export-csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  },
};

export default api;

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

// ─────────────────────────────────────────────────────────────────────────────
// In-memory GET cache — deduplicates simultaneous requests and caches responses
// for CACHE_TTL_MS ms to prevent redundant API calls across components.
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry { data: unknown; expiresAt: number }
const requestCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();

function buildCacheKey(url: string, params?: unknown): string {
  return params ? `${url}::${JSON.stringify(params)}` : url;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function cachedGet<T = any>(url: string, params?: unknown, ttl = CACHE_TTL_MS): Promise<T> {
  const key = buildCacheKey(url, params);
  const cached = requestCache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.data as T;
  const inflight = inFlightRequests.get(key);
  if (inflight) return inflight as Promise<T>;
  const promise = api
    .get<T>(url, params ? { params } : undefined)
    .then(res => {
      requestCache.set(key, { data: res.data, expiresAt: Date.now() + ttl });
      inFlightRequests.delete(key);
      return res.data;
    })
    .catch(err => { inFlightRequests.delete(key); throw err; });
  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Invalidate cached GET responses whose key starts with `pathPrefix`.
 * Call after create / update / delete mutations. Omit to clear entire cache.
 */
export function invalidateApiCache(pathPrefix?: string): void {
  if (!pathPrefix) { requestCache.clear(); return; }
  for (const key of requestCache.keys()) {
    if (key.startsWith(pathPrefix)) requestCache.delete(key);
  }
}

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
    let lastError: unknown = undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Attempt ${attempt}/${maxRetries}: Sending request to server...`);
        
        const response = await api.post('/auth/forgot-password', data, {
          timeout: 60000, // 60 seconds for this specific request
        })
        
        console.log('✅ SUCCESS! Response:', response);
        return response;
      } catch (error: unknown) {
        lastError = error;
        console.log(`❌ ATTEMPT ${attempt} FAILED!`);
        const isAxios = axios.isAxiosError(error);
        const errorName = error instanceof Error ? error.name : 'UnknownError';
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = isAxios ? error.code : undefined;
        const status = isAxios ? error.response?.status : undefined;
        const responseData = isAxios ? error.response?.data : undefined;

        console.log('❌ Error type:', errorName);
        console.log('❌ Error message:', errorMessage);
        console.log('❌ Error code:', errorCode);
        console.log('❌ Response status:', status);
        console.log('❌ Response data:', responseData);
        
        // If it's a timeout and we have retries left, continue
        if (errorMessage.includes('timeout') && attempt < maxRetries) {
          console.log(`⏳ Timeout on attempt ${attempt}, retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          continue;
        }
        
        // If it's not a timeout error, don't retry
        if (!errorMessage.includes('timeout')) {
          break;
        }
      }
    }
    
    // Handle final error after all retries
    if (!lastError) {
      throw new Error('Forgot password request failed.');
    }

    if (axios.isAxiosError(lastError) && (lastError.code === 'ECONNREFUSED' || lastError.code === 'NETWORK_ERROR')) {
      throw new Error('Cannot connect to server. Please check your network connection.');
    } else if ((lastError instanceof Error ? lastError.message : '').includes('timeout')) {
      throw new Error('Server is slow to respond. This may be due to cold start. Please wait a moment and try again.');
    } else if (axios.isAxiosError(lastError) && lastError.response?.status === 404) {
      throw new Error('Forgot password endpoint not found on the server.');
    } else if (axios.isAxiosError(lastError) && (lastError.response?.status ?? 0) >= 500) {
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
    } catch (error: unknown) {
      console.log('❌ RESET PASSWORD FAILED!');
      const isAxios = axios.isAxiosError(error);
      const status = isAxios ? error.response?.status : undefined;
      const data = isAxios ? error.response?.data : undefined;
      const message = error instanceof Error ? error.message : String(error);

      console.log('❌ Error:', data || message);
      
      if (status === 400) {
        const anyData = data as { error?: string } | undefined;
        throw new Error(anyData?.error || 'Invalid request. Please check your input.');
      } else if (status === 404) {
        throw new Error('Reset password endpoint not found.');
      } else if ((status ?? 0) >= 500) {
        throw new Error('Server error. Please try again later.');
      } else if (message.includes('timeout')) {
        throw new Error('server timeout. Please wait a moment and try again.');
      }
      
      throw error;
    }
  },
};

// Admin API
export const adminAPI = {
  getAll: async () => {
    return cachedGet('/admin');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/admin/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/admin', data);
    invalidateApiCache('/admin');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/admin/${id}`, data);
    invalidateApiCache('/admin');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/admin/${id}`);
    invalidateApiCache('/admin');
    return response.data;
  },
};

// Staff API
export const staffAPI = {
  getAll: async () => {
    return cachedGet('/staff');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/staff/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/staff', data);
    invalidateApiCache('/staff');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/staff/${id}`, data);
    invalidateApiCache('/staff');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/staff/${id}`);
    invalidateApiCache('/staff');
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
    invalidateApiCache('/staff');
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
    invalidateApiCache('/staff');
    return response.data;
  },
};

// Position API
export const positionAPI = {
  getAll: async () => {
    return cachedGet('/position');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/position/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/position', data);
    invalidateApiCache('/position');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/position/${id}`, data);
    invalidateApiCache('/position');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/position/${id}`);
    invalidateApiCache('/position');
    return response.data;
  },
};

// Unit API
export const unitAPI = {
  getAll: async () => {
    return cachedGet('/unit');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/unit/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/unit', data);
    invalidateApiCache('/unit');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/unit/${id}`, data);
    invalidateApiCache('/unit');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/unit/${id}`);
    invalidateApiCache('/unit');
    return response.data;
  },
};

// UnitType API
export const unitTypeAPI = {
  getAll: async () => {
    return cachedGet('/unittype');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/unittype/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/unittype', data);
    invalidateApiCache('/unittype');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/unittype/${id}`, data);
    invalidateApiCache('/unittype');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/unittype/${id}`);
    invalidateApiCache('/unittype');
    return response.data;
  },
};

// PositionCategory API
export const positionCategoryAPI = {
  getAll: async () => {
    return cachedGet('/positioncategory');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/positioncategory/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/positioncategory', data);
    invalidateApiCache('/positioncategory');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/positioncategory/${id}`, data);
    invalidateApiCache('/positioncategory');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/positioncategory/${id}`);
    invalidateApiCache('/positioncategory');
    return response.data;
  },
};

// Grade API
export const gradeAPI = {
  getAll: async () => {
    return cachedGet('/grade');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/grade/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/grade', data);
    invalidateApiCache('/grade');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/grade/${id}`, data);
    invalidateApiCache('/grade');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/grade/${id}`);
    invalidateApiCache('/grade');
    return response.data;
  },
};

// Level API
export const levelAPI = {
  getAll: async () => {
    return cachedGet('/level');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/level/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/level', data);
    invalidateApiCache('/level');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/level/${id}`, data);
    invalidateApiCache('/level');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/level/${id}`);
    invalidateApiCache('/level');
    return response.data;
  },
};

// Assessor API
export const assessorAPI = {
  getAll: async () => {
    return cachedGet('/assessor');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/assessor/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/assessor', data);
    invalidateApiCache('/assessor');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/assessor/${id}`, data);
    invalidateApiCache('/assessor');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/assessor/${id}`);
    invalidateApiCache('/assessor');
    return response.data;
  },
};

// Cluster API
export const clusterAPI = {
  getAll: async () => {
    return cachedGet('/cluster');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/cluster/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/cluster', data);
    invalidateApiCache('/cluster');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/cluster/${id}`, data);
    invalidateApiCache('/cluster');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/cluster/${id}`);
    invalidateApiCache('/cluster');
    return response.data;
  },
};

// Training API
export const trainingAPI = {
  getAll: async () => {
    return cachedGet('/training');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/training/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/training', data);
    invalidateApiCache('/training');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/training/${id}`, data);
    invalidateApiCache('/training');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/training/${id}`);
    invalidateApiCache('/training');
    return response.data;
  },
};

// Competency API
export const competencyAPI = {
  getAll: async () => {
    return cachedGet('/competency');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/competency/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/competency', data);
    invalidateApiCache('/competency');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/competency/${id}`, data);
    invalidateApiCache('/competency');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/competency/${id}`);
    invalidateApiCache('/competency');
    return response.data;
  },
};

// Mail API
export const mailAPI = {
  getAll: async () => {
    return cachedGet('/mail');
  },
  
  getById: async (id: string) => {
    return cachedGet(`/mail/${id}`);
  },
  
  create: async (data: any) => {
    const response = await api.post('/mail', data);
    invalidateApiCache('/mail');
    return response.data;
  },
  
  update: async (id: string, data: any) => {
    const response = await api.put(`/mail/${id}`, data);
    invalidateApiCache('/mail');
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/mail/${id}`);
    invalidateApiCache('/mail');
    return response.data;
  },
};

// Position Competency API
export const positionCompetencyAPI = {
  getAll: async () => {
    return cachedGet('/positioncompetency');
  },

  getById: async (id: string) => {
    return cachedGet(`/positioncompetency/${id}`);
  },

  getByPosition: async (positionId: string) => {
    const data = await cachedGet<any[]>('/positioncompetency');
    return data.filter((pc: any) => pc.positionId === positionId);
  },

  create: async (data: any) => {
    const response = await api.post('/positioncompetency', data);
    invalidateApiCache('/positioncompetency');
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/positioncompetency/${id}`, data);
    invalidateApiCache('/positioncompetency');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/positioncompetency/${id}`);
    invalidateApiCache('/positioncompetency');
    return response.data;
  },
};

// Training Competency API
export const trainingCompetencyAPI = {
  getAll: async () => {
    return cachedGet('/trainingcompetency');
  },

  getById: async (id: string) => {
    return cachedGet(`/trainingcompetency/${id}`);
  },

  getByTraining: async (trainingId: string) => {
    const data = await cachedGet<any[]>('/trainingcompetency');
    return data.filter((tc: any) => tc.trainingId === trainingId);
  },

  create: async (data: any) => {
    const response = await api.post('/trainingcompetency', data);
    invalidateApiCache('/trainingcompetency');
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/trainingcompetency/${id}`, data);
    invalidateApiCache('/trainingcompetency');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/trainingcompetency/${id}`);
    invalidateApiCache('/trainingcompetency');
    return response.data;
  },
};

// Setting API
export const settingAPI = {
  getAll: async () => {
    return cachedGet('/setting');
  },

  getById: async (id: string) => {
    return cachedGet(`/setting/${id}`);
  },

  create: async (data: any) => {
    const response = await api.post('/setting', data);
    invalidateApiCache('/setting');
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/setting/${id}`, data);
    invalidateApiCache('/setting');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/setting/${id}`);
    invalidateApiCache('/setting');
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
    invalidateApiCache('/setting');
    return response.data;
  },

  // Public API - no auth required
  getPublicLogo: async () => {
    return cachedGet('/public/setting/logo');
  },
};

// Assessment API
export const assessmentAPI = {
  getAll: async () => {
    return cachedGet('/assessment');
  },

  getById: async (id: string) => {
    return cachedGet(`/assessment/${id}`);
  },

  create: async (data: any) => {
    const response = await api.post('/assessment', data);
    invalidateApiCache('/assessment');
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/assessment/${id}`, data);
    invalidateApiCache('/assessment');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/assessment/${id}`);
    invalidateApiCache('/assessment');
    return response.data;
  },
};

// Assessment Result API
export const assessmentResultAPI = {
  getAll: async () => {
    return cachedGet('/assessmentresult');
  },

  getById: async (id: string) => {
    return cachedGet(`/assessmentresult/${id}`);
  },

  getByAssessment: async (assessmentId: string) => {
    const data = await cachedGet<any[]>('/assessmentresult');
    return data.filter((result: any) => result.assessmentId === assessmentId);
  },

  create: async (data: any) => {
    const response = await api.post('/assessmentresult', data);
    invalidateApiCache('/assessmentresult');
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/assessmentresult/${id}`, data);
    invalidateApiCache('/assessmentresult');
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/assessmentresult/${id}`);
    invalidateApiCache('/assessmentresult');
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
    } catch (error: unknown) {
      // If 404, endpoint not available in deployment
      if (axios.isAxiosError(error) && error.response?.status === 404) {
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
    invalidateApiCache();
    return response.data;
  },
};

// Dashboard API
export const dashboardAPI = {
  getOverview: async () => {
    return cachedGet('/dashboard/overview');
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
    return cachedGet('/competencyreport/competency-gap-by-grade', { assessmentId });
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

// Comparison API
export const comparisonAPI = {
  compareByStaff: async (params: { staffId: string; assessmentId1: string; assessmentId2: string }) => {
    return cachedGet('/comparison/staff', params, 0); // no cache — on-demand
  },

  compareByUnit: async (params: { unitId: string; assessmentId1: string; assessmentId2: string }) => {
    return cachedGet('/comparison/unit', params, 0);
  },

  compareByOrganisation: async (params: { assessmentId1: string; assessmentId2: string }) => {
    return cachedGet('/comparison/organisation', params, 0);
  },
};

// Training Demand API
export const trainingDemandAPI = {
  generateReport: async (assessmentId: string) => {
    return cachedGet('/trainingdemand/demand', { assessmentId });
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

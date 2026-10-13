import axios from 'axios';
import { api } from './client';
import { cachedGet } from './cache';

// IDP (Individual Development Plan) API
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

  exportPdf: async (data: { staffId: string; assessmentId: string }) => {
    const params = new URLSearchParams();
    params.append('staffId', data.staffId);
    params.append('assessmentId', data.assessmentId);

    const response = await api.get(`/cga/export-pdf?${params.toString()}`, {
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

// Dashboard API
export const dashboardAPI = {
  getOverview: async () => {
    return cachedGet('/dashboard/overview');
  },
};

// Competency Report API
export const competencyReportAPI = {
  getGapByGrade: async (assessmentId: string) => {
    return cachedGet('/competencyreport/competency-gap-by-grade', { assessmentId });
  },

  // Breakdowns by Negeri/Unit/Cluster/Category (item 11, NIISe JAP
  // requirements) — Negeri only meaningful when FEATURE_ZON_NEGERI is on,
  // Unit/Cluster/Category are general and available to every deployment.
  getGapByNegeri: async (assessmentId: string) => {
    return cachedGet('/competencyreport/competency-gap-by-negeri', { assessmentId });
  },

  getGapByUnit: async (assessmentId: string) => {
    return cachedGet('/competencyreport/competency-gap-by-unit', { assessmentId });
  },

  getGapByCluster: async (assessmentId: string) => {
    return cachedGet('/competencyreport/competency-gap-by-cluster', { assessmentId });
  },

  getGapByCategory: async (assessmentId: string) => {
    return cachedGet('/competencyreport/competency-gap-by-category', { assessmentId });
  },

  // `dimension` mirrors the report page's tabs (grade/negeri/unit/category/
  // cluster) — omitted defaults to 'grade' on the backend for backward
  // compat with any other caller of this API.
  exportCsv: async (data: { assessmentId: string; dimension?: string }) => {
    const params = new URLSearchParams();
    params.append('assessmentId', data.assessmentId);
    if (data.dimension) params.append('dimension', data.dimension);

    const response = await api.get(`/competencyreport/export-csv?${params.toString()}`, {
      responseType: 'blob'
    });
    return response;
  },

  exportPdf: async (data: { assessmentId: string; dimension?: string }) => {
    const params = new URLSearchParams();
    params.append('assessmentId', data.assessmentId);
    if (data.dimension) params.append('dimension', data.dimension);

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

  exportStaffCsv: async (params: { staffId: string; assessmentId1: string; assessmentId2: string }) => {
    return api.get(`/comparison/staff/export-csv?${new URLSearchParams(params).toString()}`, { responseType: 'blob' });
  },

  exportStaffPdf: async (params: { staffId: string; assessmentId1: string; assessmentId2: string }) => {
    return api.get(`/comparison/staff/export-pdf?${new URLSearchParams(params).toString()}`, { responseType: 'blob' });
  },

  exportUnitCsv: async (params: { unitId: string; assessmentId1: string; assessmentId2: string }) => {
    return api.get(`/comparison/unit/export-csv?${new URLSearchParams(params).toString()}`, { responseType: 'blob' });
  },

  exportUnitPdf: async (params: { unitId: string; assessmentId1: string; assessmentId2: string }) => {
    return api.get(`/comparison/unit/export-pdf?${new URLSearchParams(params).toString()}`, { responseType: 'blob' });
  },

  exportOrganisationCsv: async (params: { assessmentId1: string; assessmentId2: string }) => {
    return api.get(`/comparison/organisation/export-csv?${new URLSearchParams(params).toString()}`, { responseType: 'blob' });
  },

  exportOrganisationPdf: async (params: { assessmentId1: string; assessmentId2: string }) => {
    return api.get(`/comparison/organisation/export-pdf?${new URLSearchParams(params).toString()}`, { responseType: 'blob' });
  },
};

// CGA Overall API (composite gap report for a group of staff — unit/category/grade filters)
export interface CgaOverallFilter {
  assessmentId: string;
  unitId?: string;
  includeSubUnits?: boolean;
  categoryId?: string;
  gradeId?: string;
}

export const cgaOverallAPI = {
  getReport: async (filter: CgaOverallFilter) => {
    const response = await api.post('/cga/overall/report', filter);
    return response.data;
  },

  exportCsv: async (filter: CgaOverallFilter) => {
    return api.post('/cga/overall/export/csv', filter, { responseType: 'blob' });
  },
};

// Unit Competency Report API
export const unitCompetencyReportAPI = {
  getReport: async (params: { unitId: string; assessmentId: string; clusterId?: string }) => {
    const response = await api.get('/unitcompetencyreport', { params });
    return response.data.data;
  },

  exportCsv: async (params: { unitId: string; assessmentId: string; clusterId?: string }) => {
    return api.get('/unitcompetencyreport/export', { params, responseType: 'blob' });
  },
};

// Submission Tracking API
export const submissionAPI = {
  getReport: async (assessmentId: string) => {
    const response = await api.get('/submission', { params: { assessmentId } });
    return response.data.data;
  },

  exportCsv: async (assessmentId: string) => {
    return api.get('/submission/export', { params: { assessmentId }, responseType: 'blob' });
  },
};

// Executive Summary API (flagship one-page report)
export const executiveSummaryAPI = {
  getSummary: async (assessmentId: string) => {
    return cachedGet('/executivesummary/summary', { assessmentId }, 0);
  },

  exportPdf: async (assessmentId: string) => {
    return api.get('/executivesummary/export-pdf', { params: { assessmentId }, responseType: 'blob' });
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

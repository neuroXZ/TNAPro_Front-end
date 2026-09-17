import { api } from './client';

// Mirrors the backend MailJobStatus enum (MailQueue.model.ts).
export type MailJobStatus = 'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface MailBatchProgress {
  batchId: string;
  batchLabel: string | null;
  mailType: string;
  total: number;
  sent: number;
  // SENDING (in-flight) is folded into pending by the backend.
  pending: number;
  failed: number;
  cancelled: number;
  createdAt: string;
  lastActivityAt: string;
}

export interface MailJobRecord {
  id: string;
  batchId: string;
  batchLabel: string | null;
  mailType: string;
  recipient: string;
  staffId: string | null;
  staffName: string | null;
  status: MailJobStatus;
  attempts: number;
  lastError: string | null;
  scheduledFor: string;
  sentAt: string | null;
  createdAt: string;
}

export interface MailQueueConfig {
  dailyCap: number;
  ratePerSecond: number;
  // 'client' = overridden for this deployment in the Setting table;
  // 'env' = falling back to the MAIL_DAILY_CAP / MAIL_RATE_PER_SECOND env var
  // or the built-in default. Older backends omit these — treat as undefined.
  dailyCapSource?: 'client' | 'env';
  ratePerSecondSource?: 'client' | 'env';
}

export interface DrainResult {
  sent: number;
  failed: number;
  remaining: number;
  quotaExceeded: boolean;
  reason?: string;
}

// Not cached: the queue drains in the background, so the page polls for fresh
// numbers and must never read a stale cached copy.
export const mailQueueAPI = {
  listBatches: async (limit = 50): Promise<{ data: MailBatchProgress[]; config: MailQueueConfig }> => {
    const response = await api.get('/mail-queue/batches', { params: { limit } });
    return response.data;
  },

  getBatchJobs: async (batchId: string, status?: MailJobStatus): Promise<MailJobRecord[]> => {
    const response = await api.get(`/mail-queue/batches/${batchId}/jobs`, {
      params: status ? { status } : {},
    });
    return response.data.data;
  },

  retryBatch: async (batchId: string): Promise<{ requeued: number }> => {
    const response = await api.post(`/mail-queue/batches/${batchId}/retry`);
    return response.data.data;
  },

  cancelBatch: async (batchId: string): Promise<{ cancelled: number }> => {
    const response = await api.post(`/mail-queue/batches/${batchId}/cancel`);
    return response.data.data;
  },

  drain: async (): Promise<DrainResult> => {
    const response = await api.post('/mail-queue/drain');
    return response.data.data;
  },
};

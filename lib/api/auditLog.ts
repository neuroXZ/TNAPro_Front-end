import { cachedGet } from './cache';

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorRole: string | null;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogListResult {
  data: AuditLogEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export const auditLogAPI = {
  getAll: (filters: AuditLogFilters = {}) =>
    cachedGet<AuditLogListResult>('/auditlog', filters, 10_000),
};

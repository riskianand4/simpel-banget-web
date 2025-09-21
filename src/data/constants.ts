export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
} as const;

// Role permissions
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin', 
  SUPERADMIN: 'superadmin'
} as const;

// Risk levels for activities
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

// System status types
export const SYSTEM_STATUS = {
  EXCELLENT: 'excellent',
  GOOD: 'good', 
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const;

// Warehouse locations
export const WAREHOUSE_LOCATIONS = [
  'Telnet Banda Aceh',
  'Telnet Meulaboh'
] as const;
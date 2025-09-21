// Temporary type fixes for production readiness
// This file provides type utilities to fix common TypeScript issues

export type UserRole = 'user' | 'admin' | 'superadmin';

export type ApiResponseData<T = unknown> = {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
};

export type SafeApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

// Utility to safely convert old role format to new format
export const normalizeUserRole = (role: string | undefined): UserRole => {
  switch (role) {
    case 'super_admin':
      return 'superadmin';
    case 'admin':
      return 'admin';
    case 'user':
    default:
      return 'user';
  }
};

// Type guard for API responses
export const isSuccessfulApiResponse = <T>(
  response: unknown
): response is ApiResponseData<T> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'data' in response &&
    (response as any).success === true
  );
};

// Safe array access utility
export const safeArrayAccess = <T>(
  data: unknown,
  mapFn?: (item: any) => T
): T[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  if (mapFn) {
    return data.map(mapFn);
  }
  
  return data as T[];
};
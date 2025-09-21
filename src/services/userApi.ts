import { apiClient } from '@/services/apiClient';
import { User, UserActivity, Role, CreateUserInput } from '@/types/users';
import { handleApiResponse, safeApiCall } from '@/services/apiResponseHandler';
import { mapBackendToFrontendRole, mapFrontendToBackendRole } from './roleMapper';

// Data mapper to convert backend data to frontend format
const mapBackendUserToFrontend = (backendUser: any): User => {
  return {
    id: backendUser._id || backendUser.id,
    name: backendUser.name,
    email: backendUser.email,
    role: mapBackendToFrontendRole(backendUser.role),
    status: backendUser.isActive === false ? 'inactive' : 'active',
    avatar: backendUser.avatar,
    phone: backendUser.phone,
    department: backendUser.department || '',
    position: backendUser.position || '',
    createdAt: new Date(backendUser.createdAt || backendUser.created_at),
    lastLogin: backendUser.lastLogin ? new Date(backendUser.lastLogin) : undefined,
    permissions: backendUser.permissions || []
  };
};

// Data mapper to convert frontend data to backend format
const mapFrontendUserToBackend = (frontendUser: CreateUserInput | (Partial<User> & { password?: string })): any => {
  const backendUser: any = {};
  
  if (frontendUser.name) backendUser.name = frontendUser.name;
  if (frontendUser.email) backendUser.email = frontendUser.email;
  if ('password' in frontendUser && frontendUser.password) backendUser.password = frontendUser.password;
  if (frontendUser.role) {
    backendUser.role = mapFrontendToBackendRole(frontendUser.role);
  }
  if ('status' in frontendUser && frontendUser.status) {
    backendUser.isActive = frontendUser.status === 'active';
  }
  if ('avatar' in frontendUser && frontendUser.avatar) backendUser.avatar = frontendUser.avatar;
  if (frontendUser.phone) backendUser.phone = frontendUser.phone;
  if (frontendUser.department) backendUser.department = frontendUser.department;
  if (frontendUser.position) backendUser.position = frontendUser.position;
  if (frontendUser.permissions) {
    // Handle both string[] and Permission[] types
    backendUser.permissions = Array.isArray(frontendUser.permissions) ? 
      frontendUser.permissions.map(p => typeof p === 'string' ? p : p.action) :
      frontendUser.permissions;
  }
  
  return backendUser;
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  const response = await safeApiCall<any[]>(
    () => apiClient.get('/api/users'),
    'Failed to fetch users'
  );
  if (response.success && response.data) {
    return response.data.map(mapBackendUserToFrontend);
  }
  return [];
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.get(`/api/users/${id}`),
    'Failed to fetch user'
  );
  if (response.success && response.data) {
    return mapBackendUserToFrontend(response.data);
  }
  return null;
};

// Create new user
export const createUser = async (userData: CreateUserInput): Promise<User | null> => {
  const backendData = mapFrontendUserToBackend(userData);
  const response = await safeApiCall<any>(
    () => apiClient.post('/api/users', backendData),
    'Failed to create user'
  );
  if (response.success && response.data) {
    return mapBackendUserToFrontend(response.data);
  }
  return null;
};

// Update user
export const updateUser = async (id: string, userData: Partial<User>): Promise<User | null> => {
  const backendData = mapFrontendUserToBackend(userData);
  const response = await safeApiCall<any>(
    () => apiClient.put(`/api/users/${id}`, backendData),
    'Failed to update user'
  );
  if (response.success && response.data) {
    return mapBackendUserToFrontend(response.data);
  }
  return null;
};

// Toggle user active status (uses backend's specific endpoint)
export const toggleUserStatus = async (id: string): Promise<User | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.patch(`/api/users/${id}/toggle-status`),
    'Failed to toggle user status'
  );
  if (response.success && response.data) {
    return mapBackendUserToFrontend(response.data);
  }
  return null;
};

// Delete user
export const deleteUser = async (id: string): Promise<boolean> => {
  const response = await safeApiCall<boolean>(
    () => apiClient.delete(`/api/users/${id}`),
    'Failed to delete user'
  );
  return response.success;
};

// Get users by role
export const getUsersByRole = async (role: string): Promise<User[]> => {
  // Map frontend role to backend role
  const backendRole = role === 'superadmin' ? 'super_admin' : role;
  const response = await safeApiCall<User[]>(
    () => apiClient.get(`/api/users?role=${backendRole}`),
    'Failed to fetch users by role'
  );
  return response.success ? (response.data || []) : [];
};

// Get users by department
export const getUsersByDepartment = async (department: string): Promise<User[]> => {
  const response = await safeApiCall<User[]>(
    () => apiClient.get(`/api/users?department=${department}`),
    'Failed to fetch users by department'
  );
  return response.success ? (response.data || []) : [];
};

// Search users
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await safeApiCall<any[]>(
    () => apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}`),
    'Failed to search users'
  );
  if (response.success && response.data) {
    return response.data.map(mapBackendUserToFrontend);
  }
  return [];
};

// Get current user profile
export const getCurrentUser = async (): Promise<User | null> => {
  const response = await safeApiCall<any>(
    () => apiClient.get('/api/users/profile'),
    'Failed to fetch current user'
  );
  if (response.success && response.data) {
    return mapBackendUserToFrontend(response.data);
  }
  return null;
};

// Get user activity logs
export const getUserActivity = async (userId: string, filters?: any): Promise<UserActivity[]> => {
  const queryParams = filters ? new URLSearchParams(filters).toString() : '';
  const url = `/api/users/${userId}/activity${queryParams ? `?${queryParams}` : ''}`;
  
  const response = await safeApiCall<UserActivity[]>(
    () => apiClient.get(url),
    'Failed to fetch user activity'
  );
  return response.success ? (response.data || []) : [];
};

// Get available roles
export const getRoles = async (): Promise<Role[]> => {
  const response = await safeApiCall<Role[]>(
    () => apiClient.get('/api/users/roles'),
    'Failed to fetch roles'
  );
  return response.success ? (response.data || []) : [];
};

// Update user permissions
export const updateUserPermissions = async (userId: string, permissions: string[]): Promise<User | null> => {
  const response = await safeApiCall<User>(
    () => apiClient.patch(`/api/users/${userId}/permissions`, { permissions }),
    'Failed to update user permissions'
  );
  return response.success ? (response.data || null) : null;
};

// Update current user profile
export const updateCurrentUser = async (userData: Partial<User>): Promise<User | null> => {
  const backendData = mapFrontendUserToBackend(userData);
  const response = await safeApiCall<any>(
    () => apiClient.put('/api/users/profile', backendData),
    'Failed to update current user'
  );
  if (response.success && response.data) {
    return mapBackendUserToFrontend(response.data);
  }
  return null;
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  getUsersByRole,
  getUsersByDepartment,
  searchUsers,
  getCurrentUser,
  getUserActivity,
  getRoles,
  updateUserPermissions,
  updateCurrentUser,
};
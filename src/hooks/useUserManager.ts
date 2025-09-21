import { useState, useEffect, useCallback } from 'react';
import { User, UserActivity, Role, CreateUserInput } from '@/types/users';
import * as userApi from '@/services/userApi';
import { toast } from 'sonner';

interface UseUserManagerReturn {
  // State
  users: User[];
  roles: Role[];
  activities: UserActivity[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: () => Promise<void>;
  fetchUserById: (id: string) => Promise<User | null>;
  createUser: (userData: CreateUserInput) => Promise<boolean>;
  updateUser: (id: string, userData: Partial<User>) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  searchUsers: (query: string) => Promise<void>;
  fetchUserActivity: (userId: string, filters?: any) => Promise<void>;
  fetchRoles: () => Promise<void>;
  updateUserPermissions: (userId: string, permissions: string[]) => Promise<boolean>;
  
  // Filters
  filterUsersByRole: (role: string) => User[];
  filterUsersByDepartment: (department: string) => User[];
  filterActiveUsers: () => User[];
}

export const useUserManager = (): UseUserManagerReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedUsers = await userApi.getAllUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user by ID
  const fetchUserById = useCallback(async (id: string): Promise<User | null> => {
    try {
      return await userApi.getUserById(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user';
      toast.error(message);
      return null;
    }
  }, []);

  // Create new user
  const createUser = useCallback(async (userData: CreateUserInput): Promise<boolean> => {
    setIsLoading(true);
    try {
      const newUser = await userApi.createUser(userData);
      if (newUser) {
        setUsers(prev => [...prev, newUser]);
        toast.success('User created successfully');
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update user
  const updateUser = useCallback(async (id: string, userData: Partial<User>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const updatedUser = await userApi.updateUser(id, userData);
      if (updatedUser) {
        setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
        toast.success('User updated successfully');
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle user status
  const toggleUserStatus = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const updatedUser = await userApi.toggleUserStatus(id);
      if (updatedUser) {
        setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
        toast.success(`User status updated successfully`);
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to toggle user status';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete user
  const deleteUser = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await userApi.deleteUser(id);
      if (success) {
        setUsers(prev => prev.filter(user => user.id !== id));
        toast.success('User deleted successfully');
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const searchResults = await userApi.searchUsers(query);
      setUsers(searchResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to search users';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch user activity
  const fetchUserActivity = useCallback(async (userId: string, filters?: any) => {
    setIsLoading(true);
    try {
      const activityData = await userApi.getUserActivity(userId, filters);
      setActivities(activityData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user activity';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const rolesData = await userApi.getRoles();
      setRoles(rolesData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch roles';
      toast.error(message);
    }
  }, []);

  // Update user permissions
  const updateUserPermissions = useCallback(async (userId: string, permissions: string[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const updatedUser = await userApi.updateUserPermissions(userId, permissions);
      if (updatedUser) {
        setUsers(prev => prev.map(user => user.id === userId ? updatedUser : user));
        toast.success('User permissions updated successfully');
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update permissions';
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter functions
  const filterUsersByRole = useCallback((role: string): User[] => {
    return users.filter(user => user.role === role);
  }, [users]);

  const filterUsersByDepartment = useCallback((department: string): User[] => {
    return users.filter(user => user.department === department);
  }, [users]);

  const filterActiveUsers = useCallback((): User[] => {
    return users.filter(user => user.status === 'active');
  }, [users]);

  // Load initial data
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  return {
    // State
    users,
    roles,
    activities,
    isLoading,
    error,
    
    // Actions
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser,
    searchUsers,
    fetchUserActivity,
    fetchRoles,
    updateUserPermissions,
    
    // Filters
    filterUsersByRole,
    filterUsersByDepartment,
    filterActiveUsers,
  };
};
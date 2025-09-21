export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'superadmin';
  status: 'active' | 'inactive' | 'suspended';
  avatar?: string;
  phone?: string;
  department: string;
  position: string;
  createdAt: Date;
  lastLogin?: Date;
  permissions: Permission[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'superadmin';
  phone?: string;
  department?: string;
  position?: string;
  permissions?: string[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

export interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
}
export interface PSBOrder {
  _id: string;
  no: number;
  date: string;
  cluster: string;
  sto: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  address: string;
  package: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  technician?: string;
  notes?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PSBAnalytics {
  summary: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    inProgressOrders: number;
    completionRate: string;
  };
  clusterStats: Array<{
    _id: string;
    count: number;
    completed: number;
  }>;
  stoStats: Array<{
    _id: string;
    count: number;
    completed: number;
  }>;
  monthlyTrends: Array<{
    _id: { year: number; month: number };
    count: number;
    completed: number;
  }>;
}

export interface CreatePSBOrderRequest {
  cluster: string;
  sto: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  address: string;
  package: string;
  status?: string;
  technician?: string;
  notes?: string;
}
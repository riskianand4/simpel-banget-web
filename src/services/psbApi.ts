import { apiClient } from "./apiClient";
import { PSBOrder, PSBAnalytics, CreatePSBOrderRequest } from "@/types/psb";
import { API_ENDPOINTS } from "@/config/environment";
import { globalRequestThrottler } from "@/utils/requestThrottler";

export const psbApi = {
  // Get all PSB orders with pagination and filters
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    cluster?: string;
    sto?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
    technician?: string;
  }): Promise<{
    success: boolean;
    data: PSBOrder[];
    pagination?: any;
    stats?: any;
    meta?: any;
  }> => {
    const endpoint = API_ENDPOINTS.PSB.ORDERS;

    if (!globalRequestThrottler.canMakeRequest(endpoint)) {
      console.warn("🚫 PSB Orders request throttled");
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };
    }

    try {
      globalRequestThrottler.recordRequest(endpoint);

      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            queryParams.append(key, value.toString());
          }
        });
      }
      const url = `${endpoint}${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;
      const response = await apiClient.get(url);
      return response as {
        success: boolean;
        data: PSBOrder[];
        pagination: any;
        stats?: any;
        meta?: any;
      };
    } catch (error) {
      console.error("PSB API: Error fetching orders:", error);
      return {
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };
    }
  },

  // Get PSB analytics
  getAnalytics: async (): Promise<{ success: boolean; data: PSBAnalytics }> => {
    const endpoint = API_ENDPOINTS.PSB.ANALYTICS;

    if (!globalRequestThrottler.canMakeRequest(endpoint)) {
      console.warn(
        "🚫 PSB Analytics request throttled, returning cached fallback"
      );
      return {
        success: true,
        data: {
          summary: {
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            inProgressOrders: 0,
            completionRate: "0",
          },
          clusterStats: [],
          stoStats: [],
          monthlyTrends: [],
        },
      };
    }

    try {
      globalRequestThrottler.recordRequest(endpoint);

      const response = await apiClient.get(endpoint);
      return response.data as { success: boolean; data: PSBAnalytics };
    } catch (error) {
      console.error("PSB API: Error fetching analytics:", error);
      // Return mock analytics data as fallback
      return {
        success: true,
        data: {
          summary: {
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            inProgressOrders: 0,
            completionRate: "0",
          },
          clusterStats: [],
          stoStats: [],
          monthlyTrends: [],
        },
      };
    }
  },

  // Create new PSB order
  createOrder: async (
    orderData: CreatePSBOrderRequest
  ): Promise<{ success: boolean; data: PSBOrder }> => {
    try {
      console.log("PSB API: Creating order:", orderData);
      const response = await apiClient.post(
        API_ENDPOINTS.PSB.ORDERS,
        orderData
      );
      console.log("PSB API: Create response:", response.data);
      return response.data as { success: boolean; data: PSBOrder };
    } catch (error: any) {
      console.error("PSB API: Error creating order:", error);
      
      // Enhanced error handling for better user experience
      if (error.status === 409) {
        const errorMessage = error.data?.details || `Order number ${orderData.orderNo} already exists`;
        throw new Error(`409: ${errorMessage}`);
      } else if (error.status === 400) {
        const errorMessage = error.data?.details || 'Invalid data provided';
        throw new Error(`400: ${errorMessage}`);
      }
      
      throw error;
    }
  },

  // Update PSB order
  updateOrder: async (
    id: string,
    orderData: Partial<CreatePSBOrderRequest>
  ): Promise<{ success: boolean; data: PSBOrder }> => {
    try {
      console.log("PSB API: Updating order:", id, orderData);
      const response = await apiClient.put(
        `${API_ENDPOINTS.PSB.ORDERS}/${id}`,
        orderData
      );
      console.log("PSB API: Update response:", response.data);

      // Handle direct order response (backend returns order directly, not wrapped)
      if (
        response.data &&
        typeof response.data === "object" &&
        "_id" in response.data
      ) {
        return {
          success: true,
          data: response.data as PSBOrder,
        };
      }

      // Handle wrapped response format
      return response.data as { success: boolean; data: PSBOrder };
    } catch (error) {
      console.error("PSB API: Error updating order:", error);
      throw error;
    }
  },

  // Delete PSB order
  deleteOrder: async (
    id: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      console.log("PSB API: Deleting order:", id);
      const response = await apiClient.delete(
        `${API_ENDPOINTS.PSB.ORDERS}/${id}`
      );
      console.log("PSB API: Delete response:", response.data);

      // Handle case where response.data might be undefined
      if (!response.data) {
        // If response is successful but no data, assume success based on no error thrown
        return { success: true, message: "PSB order deleted successfully" };
      }

      return response.data as { success: boolean; message: string };
    } catch (error) {
      console.error("PSB API: Error deleting order:", error);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (
    id: string
  ): Promise<{ success: boolean; data: PSBOrder }> => {
    try {
      console.log("PSB API: Fetching order by ID:", id);
      const response = await apiClient.get(`${API_ENDPOINTS.PSB.ORDERS}/${id}`);
      console.log("PSB API: Order by ID response:", response.data);
      return response.data as { success: boolean; data: PSBOrder };
    } catch (error) {
      console.error("PSB API: Error fetching order by ID:", error);
      throw error;
    }
  },

  // Health check for PSB API
  healthCheck: async (): Promise<{ success: boolean; status: string }> => {
    try {
      console.log("PSB API: Health check");
      const response = await apiClient.get("/health");
      console.log("PSB API: Health check response:", response.data);
      return { success: true, status: "OK" };
    } catch (error) {
      console.error("PSB API: Health check failed:", error);
      return { success: false, status: "ERROR" };
    }
  },
};

import { useState, useEffect, useCallback } from "react";
import { psbApi } from "@/services/psbApi";
import { PSBOrder, PSBAnalytics } from "@/types/psb";
import { toast } from "sonner";
import { usePSBErrorHandler } from "@/components/ui/psb-error-boundary";

export const usePSBData = () => {
  const [orders, setOrders] = useState<PSBOrder[]>([]);
  const [analytics, setAnalytics] = useState<PSBAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { handleError } = usePSBErrorHandler();
  const [totalOrders, setTotalOrders] = useState(0);

  const fetchOrders = useCallback(
    async (params?: any, retryOnFailure = true) => {
      const maxRetries = 3;
      let currentAttempt = 0;

      while (currentAttempt < maxRetries) {
        try {
          setLoading(true);
          setError(null);

  
          const response = await psbApi.getOrders(params);
          
          // Handle both wrapped and direct array responses
          let ordersData = [];
          let success = false;
          let pagination = null;

          if (response && typeof response === "object") {
            if (response.success !== undefined) {
              // Wrapped response format: { success: boolean, data: array }
              success = response.success;
              ordersData = response.data || [];
              pagination = response.pagination || null;
            } else if (Array.isArray(response)) {
              // Direct array response
              success = true;
              ordersData = response;
            } else if (Array.isArray((response as any).data)) {
              // Response with data property containing array
              success = true;
              ordersData = (response as any).data;
              pagination = (response as any).pagination || null;
            } else {
              // Unknown format, treat as successful if data exists
              success = true;
              ordersData = [];
            }
          }

          if (success || Array.isArray(ordersData)) {
            setOrders(ordersData);
            setRetryCount(0); // Reset retry count on success
            setTotalOrders(pagination?.total || ordersData.length);
            setLoading(false); // Set loading to false on success
            return { success: true, data: ordersData, pagination };
          } else {
            throw new Error("Invalid response format");
          }
        } catch (error: any) {
          const errorDetails = handleError(error, "fetchOrders");
          console.error(
            `[PSB Hook] Error fetching orders (attempt ${currentAttempt + 1}):`,
            error
          );

          currentAttempt++;

          // If this is the last attempt or we shouldn't retry
          if (
            currentAttempt >= maxRetries ||
            !retryOnFailure ||
            !errorDetails.isNetworkError
          ) {
            setError(error.message || "Failed to fetch orders");
            setRetryCount((prev) => prev + 1);

            // Only show toast for actual network errors, not for empty data
            if (error.status >= 500 || errorDetails.isNetworkError) {
              toast.error(
                `Backend PSB service bermasalah${
                  currentAttempt > 1 ? ` (${currentAttempt} attempts)` : ""
                }`
              );
            } else if (errorDetails.isValidationError) {
              toast.error("Invalid request parameters");
            }

            // Set empty orders as fallback
            setOrders([]);
            setLoading(false); // Set loading to false on final failure
            return { success: false, data: [], pagination: null };
          }

          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, currentAttempt - 1), 5000);
          console.log(`[PSB Hook] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // This should never be reached, but just in case
      setOrders([]);
      setLoading(false); // Ensure loading is always set to false
      return { success: false, data: [], pagination: null };
    },
    [handleError]
  );

  // Set loading false when component unmounts or when we're done
  useEffect(() => {
    return () => {
      setLoading(false);
    };
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("[PSB Hook] Fetching analytics");
      const response = await psbApi.getAnalytics();

      // psbApi.getAnalytics always returns success with fallback data
      if (response.success) {
        setAnalytics(response.data);
        console.log("[PSB Hook] Analytics fetched successfully");
        return response;
      }
    } catch (error: any) {
      const errorDetails = handleError(error, "fetchAnalytics");
      console.error("[PSB Hook] Error fetching analytics:", error);
      setError(error.message || "Failed to fetch analytics");

      // Only show toast for actual API failures, not fallback data
      if (
        error.message &&
        !error.message.includes("fallback") &&
        errorDetails.isNetworkError
      ) {
        toast.error("Gagal memuat data analytics PSB");
      }

      // Set empty analytics as fallback
      const fallbackAnalytics = {
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
      };

      setAnalytics(fallbackAnalytics);
      return { success: false, data: fallbackAnalytics };
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createOrder = useCallback(
    async (orderData: any) => {
      try {
        setLoading(true);
        console.log("[PSB Hook] Creating order:", orderData);

        const response = await psbApi.createOrder(orderData);
        if (response.success) {
          toast.success("Order PSB berhasil dibuat");
          console.log("[PSB Hook] Order created successfully:", response.data);
          // Refresh orders list
          await fetchOrders(undefined, false); // Don't retry on refresh
          return response;
        } else {
          throw new Error("Failed to create order");
        }
      } catch (error: any) {
        const errorDetails = handleError(error, "createOrder");
        console.error("[PSB Hook] Error creating order:", error);

        let errorMessage = "Gagal membuat order PSB";
        if (errorDetails.isValidationError) {
          errorMessage = "Data order tidak valid";
        } else if (
          error.message?.includes("duplicate") ||
          error.message?.includes("already exists")
        ) {
          errorMessage = "Nomor order sudah ada";
        } else if (errorDetails.isNetworkError) {
          errorMessage = "Koneksi bermasalah, coba lagi";
        }

        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders, handleError]
  );

  const updateOrder = useCallback(
    async (id: string, orderData: any) => {
      try {
        setLoading(true);
        console.log("[PSB Hook] Updating order:", id, orderData);

        const response = await psbApi.updateOrder(id, orderData);
        if (response.success) {
          toast.success("Order PSB berhasil diupdate");
          console.log("[PSB Hook] Order updated successfully:", response.data);
          // Refresh orders list
          await fetchOrders(undefined, false); // Don't retry on refresh
          return response;
        } else {
          throw new Error("Failed to update order");
        }
      } catch (error: any) {
        const errorDetails = handleError(error, "updateOrder");
        console.error("[PSB Hook] Error updating order:", error);

        let errorMessage = "Gagal mengupdate order PSB";
        if (errorDetails.isValidationError) {
          errorMessage = "Data update tidak valid";
        } else if (error.message?.includes("not found")) {
          errorMessage = "Order tidak ditemukan";
        } else if (error.message?.includes("duplicate")) {
          errorMessage = "Data duplikat terdeteksi";
        } else if (errorDetails.isNetworkError) {
          errorMessage = "Koneksi bermasalah, coba lagi";
        }

        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders, handleError]
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        console.log("[PSB Hook] Deleting order:", id);

        const response = await psbApi.deleteOrder(id);

        // Handle case where response might be undefined
        if (!response) {
          toast.success("Order PSB berhasil dihapus");
          console.log(
            "[PSB Hook] Order deleted successfully (no response body)"
          );
          await fetchOrders(undefined, false);
          return { success: true, message: "Order deleted successfully" };
        }

        if (response.success) {
          toast.success("Order PSB berhasil dihapus");
          console.log("[PSB Hook] Order deleted successfully");
          // Refresh orders list
          await fetchOrders(undefined, false); // Don't retry on refresh
          return response;
        } else {
          throw new Error(response.message || "Failed to delete order");
        }
      } catch (error: any) {
        const errorDetails = handleError(error, "deleteOrder");
        console.error("[PSB Hook] Error deleting order:", error);

        let errorMessage = "Gagal menghapus order PSB";
        if (error.message?.includes("not found")) {
          errorMessage = "Order tidak ditemukan";
        } else if (errorDetails.isNetworkError) {
          errorMessage = "Koneksi bermasalah, coba lagi";
        }

        toast.error(errorMessage);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchOrders, handleError]
  );

  // Helper function to retry failed operations
  const retryLastOperation = useCallback(() => {
    console.log("[PSB Hook] Retrying last operation");
    // You could store the last operation and retry it here if needed
    fetchOrders();
  }, [fetchOrders]);

  return {
    orders,
    analytics,
    loading,
    error,
    totalOrders,
    retryCount,
    fetchOrders,
    fetchAnalytics,
    createOrder,
    updateOrder,
    deleteOrder,
    retryLastOperation,
  };
};

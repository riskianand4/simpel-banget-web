import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Phone, User, Package, AlertCircle } from 'lucide-react';
import { psbApi } from '@/services/psbApi';
import { PSBOrder } from '@/types/psb';
import { format, isAfter, subDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface RecentPSBOrdersProps {
  refreshTrigger?: number;
}

export const RecentPSBOrders: React.FC<RecentPSBOrdersProps> = ({ refreshTrigger }) => {
  const [recentOrders, setRecentOrders] = useState<PSBOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get orders from the last 24 hours
      const yesterday = subDays(new Date(), 1);
      const response = await psbApi.getOrders({
        dateFrom: format(yesterday, 'yyyy-MM-dd'),
        dateTo: format(new Date(), 'yyyy-MM-dd'),
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 10
      });

      if (response.success) {
        // Filter orders created in the last 24 hours
        const filtered = response.data.filter(order => {
          const orderDate = new Date(order.createdAt || order.date);
          return isAfter(orderDate, yesterday);
        });
        setRecentOrders(filtered);
      }
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      setError('Gagal memuat data terbaru');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentOrders();
  }, [refreshTrigger]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    // Use your original format function with date-fns
    return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span>Data Terbaru (24 Jam)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {/* Mobile Loading */}
          <div className="block xl:hidden space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 sm:p-4 border rounded-lg space-y-2 sm:space-y-3">
                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-20 sm:w-24" />
                    <Skeleton className="h-3 w-28 sm:w-32" />
                  </div>
                  <Skeleton className="h-5 w-16 sm:w-18" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
          
          {/* Desktop Loading */}
          <div className="hidden xl:block">
            <div className="overflow-hidden border rounded-lg">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-medium">Order</th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-medium">Customer</th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-medium">Location</th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-medium">Package</th>
                    <th className="px-3 lg:px-4 py-3 text-left text-xs sm:text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 lg:px-4 py-3">
                        <Skeleton className="h-4 w-16 sm:w-20" />
                      </td>
                      <td className="px-3 lg:px-4 py-3">
                        <Skeleton className="h-4 w-24 sm:w-32" />
                      </td>
                      <td className="px-3 lg:px-4 py-3">
                        <Skeleton className="h-4 w-20 sm:w-24" />
                      </td>
                      <td className="px-3 lg:px-4 py-3">
                        <Skeleton className="h-4 w-24 sm:w-28" />
                      </td>
                      <td className="px-3 lg:px-4 py-3">
                        <Skeleton className="h-5 w-14 sm:w-16" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span>Data Terbaru (24 Jam)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-muted-foreground text-sm p-3 sm:p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
            <span className="text-center sm:text-left">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 sm:pb-6 px-3 sm:px-6">
        <CardTitle className="flex flex-col xs:flex-row xs:items-center gap-2 text-base sm:text-lg">
          <div className="flex items-center gap-2 justify-center xs:justify-start">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <span>Data Terbaru (24 Jam)</span>
            {recentOrders.length > 0 && (
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">
                {recentOrders.length} item
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 sm:py-10 lg:py-12 text-muted-foreground">
            <Clock className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 mx-auto mb-4 sm:mb-6 opacity-50" />
            <p className="text-base sm:text-lg font-medium mb-2 sm:mb-3">Belum ada data terbaru</p>
            <p className="text-xs sm:text-sm lg:text-base px-4 sm:px-8">
              Data yang diinput dalam 24 jam terakhir akan muncul di sini
            </p>
          </div>
        ) : (
          <>
            {/* Mobile & Tablet Card Layout */}
            <div className="block xl:hidden space-y-3 sm:space-y-4">
              {recentOrders.map((order) => (
                <div 
                  key={order._id} 
                  className="p-3 sm:p-4 lg:p-5 border border-border rounded-lg hover:shadow-md transition-all duration-200 bg-card hover:bg-muted/30"
                >
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-2 sm:gap-3 mb-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="font-semibold text-sm sm:text-base break-words">#{order.orderNo}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(order.createdAt || order.date)}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-xs sm:text-sm flex-shrink-0 self-start xs:self-center`}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="font-medium truncate text-xs sm:text-sm">{order.customerName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{order.customerPhone}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{order.cluster} - {order.sto}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 min-w-0">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">{order.package}</span>
                    </div>
                  </div>
                  
                  {order.address && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words leading-relaxed">
                        <span className="font-medium">Alamat: </span>
                        {order.address}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden xl:block">
              <div className="overflow-x-auto">
                <div className="overflow-hidden border rounded-lg min-w-full">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 lg:px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Order</th>
                        <th className="px-3 lg:px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Customer</th>
                        <th className="px-3 lg:px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Location</th>
                        <th className="px-3 lg:px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Package</th>
                        <th className="px-3 lg:px-4 py-3 text-left text-sm font-medium text-muted-foreground whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-background">
                      {recentOrders.map((order, index) => (
                        <tr key={order._id} className={`border-t hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}>
                          <td className="px-3 lg:px-4 py-3">
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">#{order.orderNo}</div>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(order.createdAt || order.date)}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 py-3">
                            <div className="min-w-0 max-w-[200px]">
                              <div className="font-medium text-sm truncate">{order.customerName}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{order.customerPhone}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 py-3">
                            <div className="text-sm min-w-0 max-w-[150px]">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="truncate">{order.cluster}</span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{order.sto}</div>
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 py-3">
                            <div className="flex items-center gap-1 text-sm min-w-0 max-w-[180px]">
                              <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate" title={order.package}>
                                {order.package}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 lg:px-4 py-3">
                            <Badge className={`${getStatusColor(order.status)} whitespace-nowrap text-xs`}>
                              {order.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Desktop Address Section */}
              {recentOrders.some(order => order.address) && (
                <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 p-3 sm:p-4 bg-muted/20 border border-muted rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground">Alamat Lengkap:</h4>
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      order.address && (
                        <div key={`addr-${order._id}`} className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground">#{order.orderNo}:</span> {order.address}
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
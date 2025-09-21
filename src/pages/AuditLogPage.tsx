import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ModernCard from '@/components/enhanced/ModernCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Download, Search, Filter, RefreshCw, FileText } from 'lucide-react';
import AuditLogTable from '@/components/audit/AuditLogTable';
import AuditLogDetailModal from '@/components/audit/AuditLogDetailModal';
import { getAdminActivities, AdminActivity } from '@/services/systemApi';
import { useAuth } from '@/contexts/AuthContext';

const AuditLogPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AdminActivity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    admin: 'all',
    action: '',
    risk: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Load logs on component mount
  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getAdminActivities(100); // Get more logs for filtering
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      toast({
        title: "Error",
        description: "Gagal memuat log audit. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter logs based on search and filters
  const filteredLogs = logs.filter(log => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!log.admin.toLowerCase().includes(query) && !log.action.toLowerCase().includes(query) && !log.location.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Admin filter
    if (filters.admin && filters.admin !== 'all' && log.admin !== filters.admin) {
      return false;
    }

    // Action filter
    if (filters.action && !log.action.toLowerCase().includes(filters.action.toLowerCase())) {
      return false;
    }

    // Risk filter
    if (filters.risk && filters.risk !== 'all' && log.risk !== filters.risk) {
      return false;
    }

    // Date range filter
    if (filters.startDate && new Date(log.timestamp) < filters.startDate) {
      return false;
    }
    if (filters.endDate && new Date(log.timestamp) > filters.endDate) {
      return false;
    }
    return true;
  });

  // Paginated logs
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredLogs.length / pageSize);

  // Get unique admins for filter dropdown
  const uniqueAdmins = Array.from(new Set(logs.map(log => log.admin)));

  // Export logs function
  const exportLogs = (exportFormat: 'csv' | 'json') => {
    let content: string;
    let mimeType: string;
    let extension: string;
    if (exportFormat === 'csv') {
      const headers = ['Tanggal/Waktu', 'Admin', 'Aksi', 'Lokasi', 'Risk Level'];
      const rows = filteredLogs.map(log => [format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'), log.admin, log.action, log.location, log.risk]);
      content = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    } else {
      content = JSON.stringify(filteredLogs, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export Berhasil",
      description: `Log audit berhasil diekspor ke ${exportFormat.toUpperCase()}.`
    });
  };

  const clearFilters = () => {
    setFilters({
      admin: 'all',
      action: '',
      risk: 'all',
      startDate: null,
      endDate: null
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Redirect if not superadmin
  if (user?.role !== 'superadmin') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-base sm:text-lg">Akses Ditolak</CardTitle>
              <CardDescription className="text-sm">
                Halaman ini hanya dapat diakses oleh Super Admin.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6  pb-14 sm:pb-6 sm:p-6  ">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Audit Log</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Monitor aktivitas admin sistem</p>
          </div>
          
          <div className="flex flex-row xs:flex-row items-stretch xs:items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadLogs} 
              disabled={loading} 
              className="flex items-center justify-center gap-2 text-xs sm:text-sm"
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">Refresh</span>
              <span className="xs:hidden">Refresh</span>
            </Button>
            <Select onValueChange={value => exportLogs(value as 'csv' | 'json')}>
              <SelectTrigger className="w-full xs:w-32 text-xs sm:text-sm">
                <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                <SelectValue placeholder="Export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">Export CSV</SelectItem>
                <SelectItem value="json">Export JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <ModernCard variant="gradient">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-primary/10 rounded-full">
                  <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Total Log</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">{logs.length}</p>
                </div>
              </div>
            </CardContent>
          </ModernCard>
          
          <ModernCard variant="gradient">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-success/10 rounded-full flex items-center justify-center">
                  <Badge variant="secondary" className="bg-success/20 text-success border-success/30 text-xs px-1 py-0.5">
                    Low
                  </Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Low Risk</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">
                    {logs.filter(log => log.risk === 'low').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </ModernCard>
          
          <ModernCard variant="gradient">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-warning/10 rounded-full flex items-center justify-center">
                  <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/30 text-xs px-1 py-0.5">
                    Medium
                  </Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">Medium Risk</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">
                    {logs.filter(log => log.risk === 'medium').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </ModernCard>
          
          <ModernCard variant="gradient" className="">
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-destructive/10 rounded-full flex items-center justify-center">
                  <Badge variant="destructive" className="text-xs px-1 py-0.5">
                    High
                  </Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">High Risk</p>
                  <p className="text-xl sm:text-3xl font-bold text-foreground">
                    {logs.filter(log => log.risk === 'high').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </ModernCard>
        </div>

        {/* Filters */}
        <ModernCard variant="glass">
          <CardHeader className="pb-3 sm:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
              Filter & Pencarian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari admin, aksi, atau lokasi..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-8 sm:pl-10 text-sm"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Admin Filter */}
              <Select 
                value={filters.admin} 
                onValueChange={value => setFilters(prev => ({ ...prev, admin: value }))}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Pilih Admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Admin</SelectItem>
                  {uniqueAdmins.map(admin => 
                    <SelectItem key={admin} value={admin}>{admin}</SelectItem>
                  )}
                </SelectContent>
              </Select>

              {/* Risk Filter */}
              <Select 
                value={filters.risk} 
                onValueChange={value => setFilters(prev => ({ ...prev, risk: value }))}
              >
                <SelectTrigger className="text-xs sm:text-sm">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filter Button */}
              <Button 
                variant="outline" 
                onClick={clearFilters} 
                className="text-xs sm:text-sm col-span-1 sm:col-span-2 lg:col-span-1"
                size="sm"
              >
                Clear Filters
              </Button>
            </div>

            {/* Date Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="justify-start text-left font-normal text-xs sm:text-sm"
                    size="sm"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">
                      {filters.startDate ? format(filters.startDate, 'dd/MM/yyyy') : 'Dari Tanggal'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={filters.startDate} 
                    onSelect={date => setFilters(prev => ({ ...prev, startDate: date }))} 
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="justify-start text-left font-normal text-xs sm:text-sm"
                    size="sm"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="truncate">
                      {filters.endDate ? format(filters.endDate, 'dd/MM/yyyy') : 'Sampai Tanggal'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar 
                    mode="single" 
                    selected={filters.endDate} 
                    onSelect={date => setFilters(prev => ({ ...prev, endDate: date }))} 
                    initialFocus 
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </ModernCard>

        {/* Results Info */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Menampilkan {paginatedLogs.length} dari {filteredLogs.length} log
            {searchQuery || Object.values(filters).some(f => f) ? ' (filtered)' : ''}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
                className="text-xs px-2"
              >
                <span className="hidden xs:inline">Previous</span>
                <span className="xs:hidden">Prev</span>
              </Button>
              <span className="text-xs sm:text-sm px-2">
                {currentPage} / {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages}
                className="text-xs px-2"
              >
                <span className="hidden xs:inline">Next</span>
                <span className="xs:hidden">Next</span>
              </Button>
            </div>
          )}
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <AuditLogTable logs={paginatedLogs} loading={loading} onViewDetail={setSelectedLog} />
        </div>

        {/* Detail Modal */}
        <AuditLogDetailModal log={selectedLog} open={!!selectedLog} onClose={() => setSelectedLog(null)} />
      </div>
    </MainLayout>
  );
};

export default AuditLogPage;
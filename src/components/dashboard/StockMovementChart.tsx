import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { getStockMovementFlow } from '@/services/analyticsApi';
import { StockMovementFlow } from '@/types/analytics';
import { Badge } from '@/components/ui/badge';
interface StockMovementChartProps {
  className?: string;
}
const StockMovementChart: React.FC<StockMovementChartProps> = ({
  className
}) => {
  const [data, setData] = useState<StockMovementFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const months = [{
    value: '0',
    label: 'Januari'
  }, {
    value: '1',
    label: 'Februari'
  }, {
    value: '2',
    label: 'Maret'
  }, {
    value: '3',
    label: 'April'
  }, {
    value: '4',
    label: 'Mei'
  }, {
    value: '5',
    label: 'Juni'
  }, {
    value: '6',
    label: 'Juli'
  }, {
    value: '7',
    label: 'Agustus'
  }, {
    value: '8',
    label: 'September'
  }, {
    value: '9',
    label: 'Oktober'
  }, {
    value: '10',
    label: 'November'
  }, {
    value: '11',
    label: 'Desember'
  }];
  const years = ['2023', '2024', '2025'];
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range based on selected month/year
      const startDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1);
      const endDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 0);
      const movementData = await getStockMovementFlow({
        timeFilter: 'month',
        dateRange: {
          startDate,
          endDate
        }
      });

      // Filter data by selected month/year
      const filteredData = movementData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === parseInt(selectedMonth) && itemDate.getFullYear() === parseInt(selectedYear);
      });
      setData(filteredData);
    } catch (err) {
      // Error fetching stock movement data
      setError('Gagal memuat data pergerakan stock');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);
  const totalStockIn = data.reduce((sum, item) => sum + (item.stockIn || 0), 0);
  const totalStockOut = data.reduce((sum, item) => sum + Math.abs(item.stockOut || 0), 0);
  const netFlow = totalStockIn - totalStockOut;
  const renderChart = () => {
    if (chartType === 'line') {
      return <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="formattedDate" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip contentStyle={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px'
        }} formatter={(value: any, name: string) => [`${Math.abs(value)} unit`, name === 'stockIn' ? 'Stock Masuk' : name === 'stockOut' ? 'Stock Keluar' : 'Net Flow']} labelFormatter={label => `Tanggal: ${label}`} />
          <Legend />
          <Line type="monotone" dataKey="stockIn" stroke="hsl(var(--primary))" strokeWidth={2} name="Stock Masuk" dot={{
          fill: 'hsl(var(--primary))',
          strokeWidth: 2,
          r: 4
        }} />
          <Line type="monotone" dataKey="stockOut" stroke="hsl(var(--destructive))" strokeWidth={2} name="Stock Keluar" dot={{
          fill: 'hsl(var(--destructive))',
          strokeWidth: 2,
          r: 4
        }} />
          <Line type="monotone" dataKey="netFlow" stroke="hsl(var(--warning))" strokeWidth={2} strokeDasharray="5 5" name="Net Flow" dot={{
          fill: 'hsl(var(--warning))',
          strokeWidth: 2,
          r: 4
        }} />
        </LineChart>;
    } else {
      return <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="formattedDate" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip contentStyle={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px'
        }} formatter={(value: any, name: string) => [`${Math.abs(value)} unit`, name === 'stockIn' ? 'Stock Masuk' : 'Stock Keluar']} labelFormatter={label => `Tanggal: ${label}`} />
          <Legend />
          <Bar dataKey="stockIn" fill="hsl(var(--primary))" name="Stock Masuk" radius={[4, 4, 0, 0]} />
          <Bar dataKey="stockOut" fill="hsl(var(--destructive))" name="Stock Keluar" radius={[4, 4, 0, 0]} />
        </BarChart>;
    }
  };
  if (loading) {
    return <Card className={className}>
        <CardHeader>
          <CardTitle>Pergerakan Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 sm:h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className={className}>
        <CardHeader>
          <CardTitle>Pergerakan Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            <p className="text-sm sm:text-base">{error}</p>
            <Button variant="outline" onClick={fetchData} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className={`w-full ${className || ''}`}>
      <CardHeader className="space-y-3 sm:space-y-4 p-4 sm:p-6">
        <div className="space-y-2 sm:space-y-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <TrendingUp className="h-4 w-4 text-primary" />
            Pergerakan Stock
          </CardTitle>
          
          {/* Mobile-friendly filters */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map(month => <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setChartType(chartType === 'line' ? 'bar' : 'line')} className="w-full sm:w-auto">
              {chartType === 'line' ? 'Bar' : 'Line'}
            </Button>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
          <div className="flex items-center gap-2 p-2 sm:p-0">
            <ArrowUpRight className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Stock Masuk</p>
              <p className="text-base sm:text-lg font-semibold text-primary truncate">{totalStockIn.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 sm:p-0">
            <ArrowDownRight className="h-4 w-4 text-destructive flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Stock Keluar</p>
              <p className="text-base sm:text-lg font-semibold text-destructive truncate">{totalStockOut.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 sm:p-0">
            <TrendingUp className={`h-4 w-4 flex-shrink-0 ${netFlow >= 0 ? 'text-primary' : 'text-destructive'}`} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-sm text-muted-foreground">Net Flow</p>
              <div className="flex items-center justify-center gap-2">
                <p className={`text-base sm:text-lg font-semibold truncate ${netFlow >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {netFlow >= 0 ? '+' : ''}{netFlow.toLocaleString('id-ID')}
                </p>
                <Badge variant={netFlow >= 0 ? 'default' : 'destructive'} className="text-[10px] flex-shrink-0">
                  {netFlow >= 0 ? 'Surplus' : 'Defisit'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="h-48 sm:h-64 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        
        {data.length === 0 && <div className="text-center text-muted-foreground mt-4">
            <p className="text-sm sm:text-base">Tidak ada data untuk periode yang dipilih</p>
          </div>}
      </CardContent>
    </Card>;
};
export default StockMovementChart;
import React from 'react';
import { Calendar, Clock, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimeFilter, DateRange } from '../AdvancedStatsOverview';
interface StatsFiltersProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (filter: TimeFilter) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}
const StatsFilters = ({
  timeFilter,
  onTimeFilterChange,
  dateRange,
  onDateRangeChange
}: StatsFiltersProps) => {
  const handleQuickFilter = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    onDateRangeChange({
      from,
      to
    });
    if (days === 7) onTimeFilterChange('week');else if (days === 30) onTimeFilterChange('month');else if (days === 90) onTimeFilterChange('quarter');else if (days === 365) onTimeFilterChange('year');
  };
  return <Card className="p-4 lg:p-6 glass">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
        {/* Time Period Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              Periode:
            </span>
          </div>
          <Select value={timeFilter} onValueChange={value => {
          const periodMap = {
            'week': 7,
            'month': 30,
            'quarter': 90,
            'year': 365
          };
          handleQuickFilter(periodMap[value as keyof typeof periodMap]);
        }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue>
                {timeFilter === 'week' && '7 Hari'}
                {timeFilter === 'month' && '30 Hari'}
                {timeFilter === 'quarter' && '3 Bulan'}
                {timeFilter === 'year' && '1 Tahun'}
                {timeFilter === 'custom' && 'Custom'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">7 Hari</SelectItem>
              <SelectItem value="month">30 Hari</SelectItem>
              <SelectItem value="quarter">3 Bulan</SelectItem>
              <SelectItem value="year">1 Tahun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Date Range & Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 w-full sm:w-auto min-w-0", !dateRange && "text-muted-foreground")}>
                <Calendar className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">
                  {dateRange?.from ? dateRange.to ? <>
                        <span className="hidden sm:inline">
                          {format(dateRange.from, "dd MMM")} - {format(dateRange.to, "dd MMM yyyy")}
                        </span>
                        <span className="sm:hidden">
                          {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM/yy")}
                        </span>
                      </> : format(dateRange.from, "dd MMM yyyy") : <span>Pilih tanggal</span>}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent 
                initialFocus 
                defaultMonth={dateRange?.from} 
                selected={dateRange?.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                onDayClick={(day) => {
                  const currentFrom = dateRange?.from;
                  const currentTo = dateRange?.to;
                  
                  // If no dates selected, set as start date
                  if (!currentFrom) {
                    onDateRangeChange({ from: day, to: undefined });
                    return;
                  }
                  
                  // If only start date exists
                  if (currentFrom && !currentTo) {
                    if (day >= currentFrom) {
                      // Set as end date if later than start
                      onDateRangeChange({ from: currentFrom, to: day });
                      onTimeFilterChange('custom');
                    } else {
                      // Replace start date if earlier
                      onDateRangeChange({ from: day, to: undefined });
                    }
                    return;
                  }
                  
                  // If complete range exists, start new selection
                  if (currentFrom && currentTo) {
                    onDateRangeChange({ from: day, to: undefined });
                    return;
                  }
                }}
                modifiers={{
                  range_start: dateRange?.from ? [dateRange.from] : [],
                  range_end: dateRange?.to ? [dateRange.to] : [],
                  range_middle: dateRange?.from && dateRange?.to ? 
                    { from: dateRange.from, to: dateRange.to } : undefined
                }}
                modifiersStyles={{
                  range_start: { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
                  range_end: { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
                  range_middle: { backgroundColor: 'hsl(var(--primary) / 0.1)' }
                }}
                numberOfMonths={2} 
                className="pointer-events-auto" 
              />
            </PopoverContent>
          </Popover>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 flex-1 sm:flex-none">
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>;
};
export default StatsFilters;
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, X, Search, MapPin, User, Package } from 'lucide-react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

export interface FilterState {
  search: string;
  status: string;
  cluster: string;
  sto: string;
  technician: string;
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  clusters: string[];
  stos: string[];
  technicians: string[];
  isLoading: boolean;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  clusters,
  stos,
  technicians,
  isLoading
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const updateDateRange = (range: { from?: Date; to?: Date } | undefined) => {
    onFiltersChange({
      ...filters,
      dateFrom: range?.from,
      dateTo: range?.to
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.cluster && filters.cluster !== 'all') count++;
    if (filters.sto && filters.sto !== 'all') count++;
    if (filters.technician && filters.technician !== 'all') count++;
    if (filters.dateFrom || filters.dateTo) count++;
    return count;
  };

  const activeFilters = getActiveFilterCount();

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
                {activeFilters > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilters} active
                  </Badge>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Search and Quick Filters */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Customer, Order No, Phone..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                <DateRangePicker
                  date={{
                    from: filters.dateFrom,
                    to: filters.dateTo
                  }}
                  onDateChange={updateDateRange}
                />
              </div>
            </div>

            {/* Location and Assignment Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Cluster
                </Label>
                <Select value={filters.cluster} onValueChange={(value) => updateFilter('cluster', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Clusters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clusters</SelectItem>
                    {clusters.map((cluster) => (
                      <SelectItem key={cluster} value={cluster}>
                        {cluster}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>STO</Label>
                <Select value={filters.sto} onValueChange={(value) => updateFilter('sto', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All STOs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All STOs</SelectItem>
                    {stos.map((sto) => (
                      <SelectItem key={sto} value={sto}>
                        {sto}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Technician
                </Label>
                <Select value={filters.technician} onValueChange={(value) => updateFilter('technician', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Technicians" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Technicians</SelectItem>
                    {technicians.map((tech) => (
                      <SelectItem key={tech} value={tech}>
                        {tech}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Sorting */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">Date Created</SelectItem>
                    <SelectItem value="customerName">Customer Name</SelectItem>
                    <SelectItem value="orderNo">Order Number</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="cluster">Cluster</SelectItem>
                    <SelectItem value="sto">STO</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select value={filters.sortOrder} onValueChange={(value) => updateFilter('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="flex gap-2 flex-wrap">
                {filters.search && (
                  <Badge variant="outline" className="gap-1">
                    Search: {filters.search}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('search', '')}
                    />
                  </Badge>
                )}
                {filters.status && filters.status !== 'all' && (
                  <Badge variant="outline" className="gap-1">
                    Status: {filters.status}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('status', 'all')}
                    />
                  </Badge>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <Badge variant="outline" className="gap-1">
                    Date Range
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateDateRange(undefined)}
                    />
                  </Badge>
                )}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReset}
                disabled={isLoading || activeFilters === 0}
              >
                <X className="h-4 w-4 mr-2" />
                Reset All
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
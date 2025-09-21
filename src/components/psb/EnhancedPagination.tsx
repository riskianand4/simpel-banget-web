import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface EnhancedPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  isLoading?: boolean;
  showPageSizeSelector?: boolean;
  showPageInfo?: boolean;
}

export const EnhancedPagination: React.FC<EnhancedPaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  isLoading = false,
  showPageSizeSelector = true,
  showPageInfo = true
}) => {
  const { page, limit, total, pages, hasNext, hasPrev } = pagination;

  // Generate page numbers to show
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: (number | string)[] = [];
    
    if (pages <= 7) {
      // Show all pages if total is small
      for (let i = 1; i <= pages; i++) {
        range.push(i);
      }
    } else {
      // Show first page
      range.push(1);
      
      if (page > delta + 3) {
        range.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, page - delta);
      const end = Math.min(pages - 1, page + delta);
      
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      
      if (page < pages - delta - 2) {
        range.push('...');
      }
      
      // Show last page
      if (pages > 1) {
        range.push(pages);
      }
    }
    
    return range;
  };

  const visiblePages = getVisiblePages();
  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-background border-t">
      {/* Records info */}
      {showPageInfo && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Showing {startRecord}-{endRecord} of {total} records
          </span>
          {pages > 1 && (
            <Badge variant="outline" className="text-xs">
              Page {page} of {pages}
            </Badge>
          )}
        </div>
      )}

      {/* Mobile pagination (simplified) */}
      <div className="flex md:hidden items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev || isLoading}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </Button>
        
        <span className="text-sm text-muted-foreground px-2">
          {page} / {pages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || isLoading}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden md:flex items-center gap-2">
        {/* First page and previous */}
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev || isLoading}
          onClick={() => onPageChange(1)}
          className="px-2"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrev || isLoading}
          onClick={() => onPageChange(page - 1)}
          className="px-2"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === '...' ? (
                <span className="px-2 py-1 text-muted-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  disabled={isLoading}
                  onClick={() => onPageChange(pageNum as number)}
                  className={cn(
                    "min-w-[36px] px-2",
                    pageNum === page && "bg-primary text-primary-foreground"
                  )}
                >
                  {pageNum}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next and last page */}
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || isLoading}
          onClick={() => onPageChange(page + 1)}
          className="px-2"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNext || isLoading}
          onClick={() => onPageChange(pages)}
          className="px-2"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page size selector */}
      {showPageSizeSelector && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:inline">Show:</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(parseInt(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-muted-foreground hidden sm:inline">rows</span>
        </div>
      )}
    </div>
  );
};
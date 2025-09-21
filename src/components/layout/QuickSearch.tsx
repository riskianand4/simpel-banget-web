import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Command, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface SearchResult {
  title: string;
  description: string;
  href: string;
  category: string;
}

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickSearch: React.FC<QuickSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { user } = useAuth();

  const getSearchableItems = () => {
    const baseItems = [
      { title: 'Products', description: 'View and search product catalog', href: '/products', category: 'Navigation' },
      { title: 'Analytics', description: 'View statistics and insights', href: '/stats', category: 'Navigation' },
      { title: 'Reports', description: 'Generate inventory reports', href: '/reports', category: 'Navigation' },
      { title: 'Alerts', description: 'Check system notifications', href: '/alerts', category: 'Navigation' },
    ];

    if (user?.role === 'superadmin') {
      baseItems.push(
        { title: 'Stock Management', description: 'Manage inventory and stock levels', href: '/stock-movement', category: 'Admin' },
        { title: 'User Management', description: 'Manage system users', href: '/users', category: 'Admin' },
        { title: 'Settings', description: 'Configure system settings', href: '/settings', category: 'Admin' }
      );
    }

    if (user?.role === 'superadmin') {
      baseItems.push(
        { title: 'Security Center', description: 'Monitor system security', href: '/security', category: 'Super Admin' },
        { title: 'System Health', description: 'Monitor system performance', href: '/system-health', category: 'Super Admin' }
      );
    }

    return baseItems;
  };

  const searchableItems = getSearchableItems();
  const filteredResults = query 
    ? searchableItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      )
    : searchableItems.slice(0, 6);

  const handleItemClick = () => {
    setQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 md:p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Search className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden sm:inline">Quick Search</span>
            <span className="sm:hidden">Search</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-4 md:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
            <Input
              placeholder="Search for pages, features..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-sm md:text-base"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-3 md:pt-4">
          {filteredResults.length > 0 ? (
            <div className="space-y-1.5 md:space-y-2">
              {filteredResults.map((item, index) => (
                <Link key={index} to={item.href} onClick={handleItemClick}>
                  <div className="flex items-center justify-between p-2.5 md:p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer border border-transparent hover:border-border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm md:text-base truncate">{item.title}</span>
                        <span className="text-xs px-1.5 md:px-2 py-0.5 md:py-1 bg-muted rounded-full text-muted-foreground whitespace-nowrap">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-none">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 ml-2" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <Search className="h-6 w-6 md:h-8 md:w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm md:text-base text-muted-foreground">
                No results found for "{query}"
              </p>
            </div>
          )}
        </div>

        <div className="px-4 md:px-6 py-2.5 md:py-3 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 md:px-2 py-0.5 md:py-1 bg-background rounded border text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 md:px-2 py-0.5 md:py-1 bg-background rounded border text-xs">K</kbd>
              <span>to search</span>
            </div>
            <div className="sm:hidden text-xs text-muted-foreground">
              Tap to search and navigate
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
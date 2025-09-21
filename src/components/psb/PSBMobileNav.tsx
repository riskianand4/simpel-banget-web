import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Plus, Users, FileText, Database } from 'lucide-react';

const mobileNavItems = [
  {
    title: 'Dashboard',
    href: '/psb-report',
    icon: BarChart3,
  },
  {
    title: 'Input',
    href: '/psb-report/input',
    icon: Plus,
  },
  {
    title: 'Customers',
    href: '/psb-report/customers',
    icon: Users,
  },
  {
    title: 'Reports',
    href: '/psb-report/reports',
    icon: FileText,
  },
  {
    title: 'Data',
    href: '/psb-report/data',
    icon: Database,
  },
];

export const PSBMobileNav: React.FC = () => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="flex items-center justify-around py-2">
        {mobileNavItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/psb-report'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.title}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
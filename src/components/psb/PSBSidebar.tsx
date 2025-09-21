import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, FileText, Plus, Users, Settings, ArrowLeft, Database, PieChart, TrendingUp } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
const navigation = [{
  title: 'Dashboard',
  href: '/psb-report',
  icon: BarChart3,
  description: 'Analytics dan monitoring PSB'
}, {
  title: 'Input Data',
  href: '/psb-report/input',
  icon: Plus,
  description: 'Tambah data order PSB'
}, {
  title: 'Data Pelanggan',
  href: '/psb-report/customers',
  icon: Users,
  description: 'Kelola data pelanggan'
}, {
  title: 'Laporan',
  href: '/psb-report/reports',
  icon: FileText,
  description: 'Generate laporan PSB'
}, {
  title: 'Analytics',
  href: '/psb-report/analytics',
  icon: TrendingUp,
  description: 'Analisa performa PSB'
}, {
  title: 'Data Management',
  href: '/psb-report/data',
  icon: Database,
  description: 'Manajemen data PSB'
}];
export const PSBSidebar: React.FC = () => {
  const location = useLocation();
  const {
    state
  } = useSidebar();
  const collapsed = state === 'collapsed';
  const isActive = (path: string) => {
    if (path === '/psb-report') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  return <Sidebar className={`${collapsed ? 'w-16' : 'w-60'} hidden md:flex border-r transition-all duration-300`}>
      <SidebarHeader className="border-b py-3 px-6">
        <motion.div className="flex items-center gap-3" initial={{
        opacity: 0,
        x: -20
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.3
      }}>
          <div className="w-8 h-8 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <PieChart className="h-4 w-4 text-white" />
          </div>
          {!collapsed && <div>
              <h2 className="font-bold text-md bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                Report PSB
              </h2>
              <p className="text-[10px] text-muted-foreground">Professional Analytics</p>
            </div>}
        </motion.div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground/70 mb-3">
            {!collapsed ? 'MENU UTAMA' : ''}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-4">
              {navigation.map((item, index) => {
              const Icon = item.icon;
              const itemIsActive = isActive(item.href);
              return <SidebarMenuItem key={item.href}>
                    <motion.div initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  duration: 0.3,
                  delay: index * 0.05
                }}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.href} end={item.href === '/psb-report'} className={`flex items-center gap-3 px-3 py-5 rounded-lg transition-all duration-200 group relative overflow-hidden ${itemIsActive ? 'bg-gradient-to-r from-primary/5 to-primary/10 text-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-md'}`}>
                           <Icon className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${itemIsActive ? 'text-primary scale-110' : 'group-hover:text-primary group-hover:scale-105'}`} />
                          
                           {!collapsed && <div className="flex-1 min-w-0">
                               <span className="font-medium text-sm">{item.title}</span>
                             </div>}
                          
                           {itemIsActive && !collapsed && <motion.div className="w-2 h-2 bg-primary rounded-full" layoutId="activeIndicator" initial={{
                        scale: 0
                      }} animate={{
                        scale: 1
                      }} transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30
                      }} />}
                          
                          {/* Hover effect background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </NavLink>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>;
            })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
};
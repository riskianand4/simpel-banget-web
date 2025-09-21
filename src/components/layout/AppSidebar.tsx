import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from '@/components/ui/sidebar';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AddProductDialog from '@/components/products/AddProductDialog';
import { Package, BarChart3, Plus, Wifi, Home, TrendingUp, HardDrive, Users, Shield, Settings, Database, AlertTriangle, FileText, Monitor, Key, Bell, Download, User } from 'lucide-react';

// Main navigation items - core features
const mainMenuItems = [{
  title: "Dashboard",
  url: "/",
  icon: Home,
  roles: ['user', 'admin', 'superadmin'],
  description: "Ringkasan utama dan aksi cepat"
}, {
  title: "Produk",
  url: "/products",
  icon: Package,
  roles: ['user', 'admin', 'superadmin'],
  description: "Katalog produk dan inventori"
}, {
  title: "Inventori",
  url: "/inventory",
  icon: HardDrive,
  roles: ['user', 'admin', 'superadmin'],
  description: "Monitoring inventori real-time"
}, {
  title: "Aset",
  url: "/assets",
  icon: Monitor,
  roles: ['user', 'admin', 'superadmin'],
  description: "Kelola aset perusahaan"
}, {
  title: "Peringatan",
  url: "/alerts",
  icon: Bell,
  roles: ['admin', 'superadmin'],
  description: "Peringatan sistem dan notifikasi"
}];

// Additional Apps
const additionalApps = [{
  title: "Report PSB",
  url: "/psb-report",
  icon: BarChart3,
  roles: ['user', 'admin', 'superadmin'],
  description: "Sistem pelaporan PSB",
  badge: "New"
}];

// Admin navigation items - management features
const adminMenuItems = [{
  title: "Pergerakan Stok",
  url: "/stock-movement",
  icon: TrendingUp,
  roles: ['admin', 'superadmin'],
  description: "Lacak perubahan inventori"
}, {
  title: "Pengguna",
  url: "/users",
  icon: Users,
  roles: ['superadmin'],
  description: "Kelola pengguna sistem"
}, {
  title: "Laporan Stok",
  url: "/stock-report",
  icon: FileText,
  roles: ['admin', 'superadmin'],
  description: "Buat laporan inventori"
}, {
  title: "Buat Laporan",
  url: "/stock-report?generate=true",
  icon: Download,
  roles: ['user', 'admin', 'superadmin'],
  description: "Pembuatan laporan cepat"
}];

// Super Admin navigation items - system management
const systemMenuItems = [{
  title: "Log Audit",
  url: "/audit-log",
  icon: FileText,
  roles: ['superadmin'],
  description: "Log aktivitas administrator dan audit keamanan"
}, {
  title: "Manajemen API",
  url: "/api-management",
  icon: Key,
  roles: ['superadmin'],
  description: "Kelola kunci API dan integrasi"
}, {
  title: "Pusat Keamanan",
  url: "/security", 
  icon: Shield,
  roles: ['superadmin'],
  description: "Monitoring keamanan & log audit"
}, {
  title: "Kesehatan Database",
  url: "/database",
  icon: Database,
  roles: ['superadmin'],
  description: "Monitoring performa database"
}, {
  title: "Profil",
  url: "/settings",
  icon: User,
  roles: ['user', 'admin', 'superadmin'],
  description: "Profil dan pengaturan akun"
}];
export function AppSidebar() {
  const {
    user
  } = useAuth();
  const sidebar = useSidebar();
  const collapsed = sidebar?.state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  const quickActions = [{
    title: 'Tambah Produk',
    icon: Plus,
    roles: ['admin', 'superadmin'],
    action: () => setShowAddProduct(true)
  }];
  const filteredMainItems = mainMenuItems.filter(item => item.roles.includes(user?.role || 'user'));
  const filteredAdminItems = adminMenuItems.filter(item => item.roles.includes(user?.role || 'user'));
  const filteredSystemItems = systemMenuItems.filter(item => item.roles.includes(user?.role || 'user'));
  const filteredQuickActions = quickActions.filter(action => action.roles.includes(user?.role || 'user'));
  const filteredAdditionalApps = additionalApps.filter(item => item.roles.includes(user?.role || 'user'));
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-destructive';
      case 'admin':
        return 'bg-warning';
      default:
        return 'bg-success';
    }
  };
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      default:
        return 'User';
    }
  };
  return <>
      <Sidebar className={`${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarHeader className="p-6 border-b border-sidebar-border">
          <motion.div className="flex items-center space-x-3" initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.3
        }}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-glow">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            {!collapsed && <div>
                <h2 className="text-xs md:text-sm font-bold text-sidebar-foreground">Telnet Inventory</h2>
                <p className="text-xs text-sidebar-foreground/70">Smart Management</p>
              </div>}
          </motion.div>

          {!collapsed}
        </SidebarHeader>

        <SidebarContent className="p-4 px-[3px]">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 mb-2">
              {!collapsed ? 'NAVIGASI UTAMA' : ''}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {filteredMainItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = currentPath === item.url;
                return <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
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
                          <NavLink to={item.url} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-medium' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
                            <Icon className={`w-5 h-5 ${isActive ? 'text-sidebar-accent-foreground' : 'group-hover:text-sidebar-primary'}`} />
                             {!collapsed && <span className="font-medium text-xs md:text-sm">{item.title}</span>}
                            {isActive && !collapsed && <motion.div className="ml-auto w-2 h-2 bg-sidebar-accent-foreground rounded-full" layoutId="activeIndicator" initial={{
                          scale: 0
                        }} animate={{
                          scale: 1
                        }} transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }} />}
                          </NavLink>
                        </motion.div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>;
              })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Additional Apps */}
          {filteredAdditionalApps.length > 0 && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 mb-2">
                {!collapsed ? 'APLIKASI TAMBAHAN' : ''}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredAdditionalApps.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = currentPath.startsWith(item.url);
                  return <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <motion.div initial={{
                        opacity: 0,
                        x: -20
                      }} animate={{
                        opacity: 1,
                        x: 0
                      }} transition={{
                        duration: 0.3,
                        delay: (filteredMainItems.length + index) * 0.05
                      }}>
                            <NavLink to={item.url} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-medium' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
                              <Icon className={`w-5 h-5 ${isActive ? 'text-sidebar-accent-foreground' : 'group-hover:text-sidebar-primary'}`} />
                               {!collapsed && (
                                 <div className="flex items-center justify-between w-full">
                                   <span className="font-medium text-xs md:text-sm">{item.title}</span>
                                   {item.badge && (
                                     <Badge variant="secondary" className="text-xs ml-2">
                                       {item.badge}
                                     </Badge>
                                   )}
                                 </div>
                               )}
                              {isActive && !collapsed && <motion.div className="ml-auto w-2 h-2 bg-sidebar-accent-foreground rounded-full" layoutId="activeIndicator" initial={{
                            scale: 0
                          }} animate={{
                            scale: 1
                          }} transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }} />}
                            </NavLink>
                          </motion.div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>;
                })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Admin Navigation */}
          {filteredAdminItems.length > 0 && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 mb-2">
                {!collapsed ? 'MANAJEMEN' : ''}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredAdminItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.url;
                  return <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <motion.div initial={{
                        opacity: 0,
                        x: -20
                      }} animate={{
                        opacity: 1,
                        x: 0
                      }} transition={{
                        duration: 0.3,
                        delay: (filteredMainItems.length + index) * 0.05
                      }}>
                            <NavLink to={item.url} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-medium' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
                              <Icon className={`w-5 h-5 ${isActive ? 'text-sidebar-accent-foreground' : 'group-hover:text-sidebar-primary'}`} />
                               {!collapsed && <span className="font-medium text-xs md:text-sm">{item.title}</span>}
                              {isActive && !collapsed && <motion.div className="ml-auto w-2 h-2 bg-sidebar-accent-foreground rounded-full" layoutId="activeIndicator" initial={{
                            scale: 0
                          }} animate={{
                            scale: 1
                          }} transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }} />}
                            </NavLink>
                          </motion.div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>;
                })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* System Navigation */}
          {filteredSystemItems.length > 0 && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 mb-2">
                {!collapsed ? 'SISTEM' : ''}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredSystemItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.url;
                  return <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <motion.div initial={{
                        opacity: 0,
                        x: -20
                      }} animate={{
                        opacity: 1,
                        x: 0
                      }} transition={{
                        duration: 0.3,
                        delay: (filteredMainItems.length + filteredAdminItems.length + index) * 0.05
                      }}>
                            <NavLink to={item.url} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 group ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-medium' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}>
                              <Icon className={`w-5 h-5 ${isActive ? 'text-sidebar-accent-foreground' : 'group-hover:text-sidebar-primary'}`} />
                              {!collapsed && <span className="font-medium text-xs md:text-sm">{item.title}</span>}
                              {isActive && !collapsed && <motion.div className="ml-auto w-2 h-2 bg-sidebar-accent-foreground rounded-full" layoutId="activeIndicator" initial={{
                            scale: 0
                          }} animate={{
                            scale: 1
                          }} transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }} />}
                            </NavLink>
                          </motion.div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>;
                })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && !collapsed && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 mb-2">
                AKSI CEPAT
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2">
                  {filteredQuickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.title}
                        onClick={action.action}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium text-xs md:text-sm">Tambah Produk</span>
                      </button>
                    );
                  })}
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>
      
    </>;
}
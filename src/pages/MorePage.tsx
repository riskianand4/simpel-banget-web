import React from 'react';
import { useApp } from '@/contexts/AppContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Database, 
  Shield, 
  Brain, 
  FileText, 
  TrendingUp,
  Package,
  ArrowUpDown,
  ClipboardList,
  BarChart2,
  Bell,
  Archive,
  BookOpen,
  Zap,
  ChevronRight,
  User,
  Key,
  ScrollText
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MorePage = () => {
  const { user } = useApp();

  if (!user) {
    return <ModernLoginPage />;
  }

  const menuSections = [
    {
      title: "Laporan & Analisa",
      items: [
        {
          title: "Laporan Stok",
          description: "Generate laporan inventori lengkap",
          icon: FileText,
          path: "/stock-report",
          roles: ['superadmin']
        },
        {
          title: "Buat Laporan",
          description: "Buat laporan custom dengan cepat",
          icon: BarChart2,
          path: "/stock-report?generate=true",
          roles: ['user', 'superadmin']
        }
      ]
    },
    {
      title: "Manajemen",
      items: [
        {
          title: "Pergerakan Stok",
          description: "Pantau pergerakan stok real-time",
          icon: TrendingUp,
          path: "/stock-movement",
          roles: ['superadmin']
        },
        {
          title: "Pengguna",
          description: "Kelola pengguna sistem",
          icon: Users,
          path: "/users",
          roles: ['superadmin']
        }
      ]
    },
    {
      title: "Sistem & Tools",
      items: [
        {
          title: "Peringatan",
          description: "Monitor peringatan dan notifikasi sistem",
          icon: Bell,
          path: "/alerts",
          roles: ['user', 'superadmin']
        },
        {
          title: "Studio AI",
          description: "AI assistant dan otomasi cerdas",
          icon: Brain,
          path: "/ai-studio",
          roles: ['superadmin']
        },
        {
          title: "Pengaturan",
          description: "Pengaturan sistem dan konfigurasi",
          icon: Settings,
          path: "/settings",
          roles: ['user', 'superadmin']
        }
      ]
    },
    {
      title: "Super Admin",
      items: [
        {
          title: "Manajemen API",
          description: "Kelola API keys dan integrasi",
          icon: Key,
          path: "/api-management",
          roles: ['superadmin']
        },
        {
          title: "Pusat Keamanan",
          description: "Monitoring keamanan sistem",
          icon: Shield,
          path: "/security",
          roles: ['superadmin']
        },
        {
          title: "Log Audit",
          description: "Pantau aktivitas dan riwayat sistem",
          icon: ScrollText,
          path: "/audit-log",
          roles: ['superadmin']
        },
        {
          title: "Kesehatan Database",
          description: "Monitoring performa database",
          icon: Database,
          path: "/database",
          roles: ['superadmin']
        }
      ]
    }
  ];

  // Filter menu items based on user role
  const filteredSections = menuSections.map(section => ({
    ...section,
    items: section.items.filter(item => 
      item.roles.includes(user.role)
    )
  })).filter(section => section.items.length > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-muted/10 mobile-responsive-padding pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mobile-content-container mobile-spacing-normal"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center mobile-spacing-normal">
            <div className="flex flex-col sm:flex-row items-center justify-center mobile-gap-normal">
              <div className="p-3 rounded-full bg-primary/10">
                <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <h1 className="mobile-text-large font-bold text-primary">
                  Menu Lainnya
                </h1>
                <p className="text-muted-foreground mobile-text-small">
                  Akses fitur dan pengaturan lengkap
                </p>
              </div>
            </div>

            {/* User Info */}
            <Card className="mobile-padding-normal glass max-w-md mx-auto">
              <div className="flex items-center mobile-gap-normal">
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <div className="mobile-text-small font-medium truncate">{user.name}</div>
                  <div className="mobile-text-tiny text-muted-foreground truncate">{user.email}</div>
                  <Badge variant="secondary" className="mobile-text-tiny mt-1">
                     {user?.role === 'superadmin' ? 'Super Admin' : 'User'}
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Menu Sections */}
          {filteredSections.map((section, sectionIndex) => (
            <motion.div
              key={section.title}
              variants={itemVariants}
              className="space-y-4"
            >
              <h2 className="mobile-text-medium font-semibold text-foreground px-2">
                {section.title}
              </h2>
              
              <div className="mobile-grid-1-2 mobile-gap-normal">
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  
                  return (
                    <motion.div
                      key={item.title}
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link to={item.path} className="block">
                        <Card className="mobile-padding-normal hover:shadow-md transition-all duration-200 glass group cursor-pointer mobile-touch-target">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center mobile-gap-normal min-w-0 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="mobile-text-small font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                  {item.title}
                                </h3>
                                <p className="mobile-text-tiny text-muted-foreground truncate">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          {/* Footer Note */}
          <motion.div variants={itemVariants} className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Menu yang ditampilkan disesuaikan dengan peran Anda
            </p>
          </motion.div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default MorePage;
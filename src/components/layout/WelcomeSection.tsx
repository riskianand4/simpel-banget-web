import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Calendar } from 'lucide-react';
import { getRoleDisplayName } from '@/services/roleMapper';

interface WelcomeSectionProps {
  className?: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ className = '' }) => {
  const { user } = useApp();
  const location = useLocation();

  // Only show on home/dashboard page
  const shouldShow = location.pathname === '/' || location.pathname === '/dashboard';
  
  if (!user || !shouldShow) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 17) return 'Selamat Siang';
    if (hour < 20) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWelcomeDescription = () => {
    const descriptions = [
      "Mari kelola inventori dengan lebih efisien hari ini!",
      "Pantau stok dan tingkatkan produktivitas bisnis Anda.",
      "Dashboard siap membantu mengoptimalkan operasional harian.",
      "Waktunya menganalisis data dan membuat keputusan terbaik.",
      "Sistem terintegrasi untuk kemudahan manajemen inventori."
    ];
    
    // Use user ID to get consistent description
    const index = user.id ? parseInt(user.id.slice(-1) || '0') % descriptions.length : 0;
    return descriptions[index];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 shadow-sm">
        <div className="p-3 md:p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Greeting */}
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h2 className="text-lg md:text-xl font-bold text-foreground">
                  {getGreeting()}, {user.name.split(' ')[0]}! 👋
                </h2>
              </div>

              {/* Description */}
              <p className="text-sm md:text-base text-muted-foreground mb-3 leading-relaxed">
                {getWelcomeDescription()}
              </p>

              {/* Date and Role Info */}
              <div className="flex items-center gap-3 text-xs md:text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{getCurrentDate()}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
            </div>

            {/* Welcome Icon */}
            <div className="ml-4 hidden sm:block">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
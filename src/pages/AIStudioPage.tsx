import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ModernLoginPage from '@/components/auth/ModernLoginPage';
import MainLayout from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnomalyDetection from '@/components/ai/AnomalyDetection';
import SmartReorderEngine from '@/components/ai/SmartReorderEngine';
import VoiceCommands from '@/components/ai/VoiceCommands';
import AIBusinessIntelligence from '@/components/ai/AIBusinessIntelligence';
import { Brain, Bot, Mic, TrendingUp, Zap } from 'lucide-react';

const AIStudioPage = () => {
  const { user } = useAuth();

  if (!user) {
    return <ModernLoginPage />;
  }

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6 pb-14 sm:pb-6 md:p-6">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center justify-center md:justify-start gap-2 md:gap-3">
            <Brain className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <span className="break-words">Studio AI</span>
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Fitur AI canggih untuk optimasi inventori dan business intelligence
          </p>
        </div>

        <Tabs defaultValue="intelligence" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 md:gap-0 h-auto md:h-10">
            <TabsTrigger value="intelligence" className="flex-col md:flex-row gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <Brain className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Intelijen Bisnis</span>
              <span className="sm:hidden">Intelijen</span>
            </TabsTrigger>
            <TabsTrigger value="anomaly" className="flex-col md:flex-row gap-1 md:gap-2 p-2 md:p-3 text-xs md:text-sm">
              <Zap className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Deteksi Anomali</span>
              <span className="sm:hidden">Anomali</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="intelligence" className="space-y-4">
            <AIBusinessIntelligence />
          </TabsContent>

          <TabsContent value="anomaly" className="space-y-4">
            <AnomalyDetection />
          </TabsContent>

          <TabsContent value="reorder" className="space-y-4">
            <SmartReorderEngine />
          </TabsContent>

          <TabsContent value="voice" className="space-y-4">
            <VoiceCommands />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AIStudioPage;
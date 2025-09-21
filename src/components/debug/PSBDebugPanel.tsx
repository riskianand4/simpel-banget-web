import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Server, 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Terminal
} from 'lucide-react';
import { psbApi } from '@/services/psbApi';
import { ENV } from '@/config/environment';
import { toast } from 'sonner';

export const PSBDebugPanel: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [backendUrl, setBackendUrl] = useState(ENV.API_BASE_URL);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>('');
  
  const checkBackendHealth = async () => {
    setHealthStatus('checking');
    setErrorDetails('');
    
    try {
      console.log('PSB Debug: Checking backend health...');
      const healthResponse = await psbApi.healthCheck();
      
      if (healthResponse.success) {
        setHealthStatus('healthy');
        toast.success('Backend PSB tersedia');
      } else {
        throw new Error('Health check failed');
      }
      
      setLastCheck(new Date());
    } catch (error: any) {
      console.error('PSB Debug: Health check failed:', error);
      setHealthStatus('error');
      setErrorDetails(error.message || 'Backend tidak dapat dijangkau');
      toast.error('Backend PSB tidak tersedia');
    }
  };

  const testPSBEndpoints = async () => {
    try {
      console.log('PSB Debug: Testing PSB endpoints...');
      
      // Test analytics endpoint
      const analyticsResponse = await psbApi.getAnalytics();
      console.log('PSB Debug: Analytics response:', analyticsResponse);
      
      // Test orders endpoint
      const ordersResponse = await psbApi.getOrders({ limit: 5 });
      console.log('PSB Debug: Orders response:', ordersResponse);
      
      toast.success('Endpoints PSB berfungsi dengan baik');
    } catch (error: any) {
      console.error('PSB Debug: Endpoint test failed:', error);
      toast.error(`Test endpoints gagal: ${error.message}`);
    }
  };

  React.useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">PSB Debug Panel</h1>
          <p className="text-muted-foreground">Monitor dan debug koneksi PSB backend</p>
        </div>
        <Button onClick={checkBackendHealth} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status Koneksi Backend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {healthStatus === 'checking' && (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                  <span>Memeriksa koneksi...</span>
                </>
              )}
              {healthStatus === 'healthy' && (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Backend PSB Tersedia</span>
                </>
              )}
              {healthStatus === 'error' && (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>Backend PSB Tidak Tersedia</span>
                </>
              )}
            </div>
            <Badge variant={healthStatus === 'healthy' ? 'default' : 'destructive'}>
              {healthStatus === 'healthy' ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p><strong>Backend URL:</strong> {backendUrl}</p>
            {lastCheck && (
              <p><strong>Last Check:</strong> {lastCheck.toLocaleTimeString()}</p>
            )}
          </div>

          {errorDetails && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error Details:</strong>
                <p className="mt-1 font-mono text-xs">{errorDetails}</p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* API Endpoints Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Test API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-blue-500" />
                <code className="text-sm">/api/psb-orders/analytics</code>
              </div>
              <Badge variant="outline">Analytics</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Database className="h-4 w-4 text-green-500" />
                <code className="text-sm">/api/psb-orders</code>
              </div>
              <Badge variant="outline">Orders</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Server className="h-4 w-4 text-purple-500" />
                <code className="text-sm">/health</code>
              </div>
              <Badge variant="outline">Health</Badge>
            </div>
          </div>

          <Button onClick={testPSBEndpoints} className="w-full">
            Test All Endpoints
          </Button>
        </CardContent>
      </Card>

      {/* Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Troubleshooting Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="p-3 bg-muted rounded-lg">
              <strong>1. Backend Server</strong>
              <p>Pastikan backend server berjalan di port 3001:</p>
              <code className="block mt-1 p-2 bg-background rounded text-xs">cd backend && npm run dev</code>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <strong>2. Database Connection</strong>
              <p>Periksa koneksi MongoDB di file .env:</p>
              <code className="block mt-1 p-2 bg-background rounded text-xs">MONGODB_URI=mongodb://localhost:27017/inventory_management</code>
            </div>
            
            <div className="p-3 bg-muted rounded-lg">
              <strong>3. PSB Routes</strong>
              <p>Pastikan route PSB ter-register di backend/server.js:</p>
              <code className="block mt-1 p-2 bg-background rounded text-xs">app.use("/api/psb-orders", auth, psbOrderRoutes);</code>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <strong>4. CORS Configuration</strong>
              <p>Periksa CORS origin di backend/.env:</p>
              <code className="block mt-1 p-2 bg-background rounded text-xs">CORS_ORIGIN=http://localhost:8080</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
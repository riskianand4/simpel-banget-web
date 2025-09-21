import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Copy, Save, Clock, CheckCircle, XCircle, Code, History } from 'lucide-react';
import { toast } from 'sonner';

interface TestRequest {
  id: string;
  name: string;
  method: string;
  endpoint: string;
  headers: Record<string, string>;
  body: string;
  timestamp: string;
  status?: number;
  responseTime?: number;
  response?: string;
}

const presetRequests: TestRequest[] = [
  {
    id: '1',
    name: 'Health Check',
    method: 'GET',
    endpoint: '/api/external/health',
    headers: {},
    body: '',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Get All Products',
    method: 'GET',
    endpoint: '/api/external/products',
    headers: {},
    body: '',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: '3',
    name: 'Get Product Categories',
    method: 'GET',
    endpoint: '/api/external/products/meta/categories',
    headers: {},
    body: '',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: '4',
    name: 'Get Analytics Overview',
    method: 'GET',
    endpoint: '/api/external/analytics/overview',
    headers: {},
    body: '',
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: '5',
    name: 'API Documentation',
    method: 'GET',
    endpoint: '/api/external/docs',
    headers: {},
    body: '',
    timestamp: '2024-01-15T10:30:00Z'
  }
];

export const ApiTester: React.FC = () => {
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('');
  const [headers, setHeaders] = useState('{}');
  const [requestBody, setRequestBody] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequest, setLastRequest] = useState<TestRequest | null>(null);
  const [history, setHistory] = useState<TestRequest[]>([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const loadPreset = (preset: TestRequest) => {
    setMethod(preset.method);
    setEndpoint(preset.endpoint);
    setHeaders(JSON.stringify(preset.headers, null, 2));
    setRequestBody(preset.body);
  };

  const saveRequest = () => {
    if (!endpoint) {
      toast.error('Please enter an endpoint');
      return;
    }

    const newRequest: TestRequest = {
      id: Date.now().toString(),
      name: `${method} ${endpoint}`,
      method,
      endpoint,
      headers: JSON.parse(headers || '{}'),
      body: requestBody,
      timestamp: new Date().toISOString()
    };

    setHistory(prev => [newRequest, ...prev.slice(0, 9)]); // Keep last 10
    toast.success('Request saved to history');
  };

  const executeRequest = async () => {
    if (!endpoint || !selectedApiKey) {
      toast.error('Please enter endpoint and select API key');
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      // Parse headers
      let parsedHeaders: Record<string, string> = {};
      try {
        parsedHeaders = JSON.parse(headers || '{}');
      } catch (e) {
        toast.error('Invalid JSON in headers');
        setIsLoading(false);
        return;
      }

      // Add API key header
      parsedHeaders['x-api-key'] = selectedApiKey;

      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: parsedHeaders,
      };

      if (method !== 'GET' && requestBody) {
        requestOptions.body = requestBody;
      }

      // Make the request - use backend server URL
      const backendUrl = 'http://103.169.41.9:3001';
      const response = await fetch(`${backendUrl}${endpoint}`, requestOptions);
      const responseTime = Date.now() - startTime;
      const responseText = await response.text();

      // Try to format JSON response
      let formattedResponse = responseText;
      try {
        const jsonResponse = JSON.parse(responseText);
        formattedResponse = JSON.stringify(jsonResponse, null, 2);
      } catch (e) {
        // Not JSON, keep as is
      }

      setResponse(formattedResponse);
      
      const requestRecord: TestRequest = {
        id: Date.now().toString(),
        name: `${method} ${endpoint}`,
        method,
        endpoint,
        headers: parsedHeaders,
        body: requestBody,
        timestamp: new Date().toISOString(),
        status: response.status,
        responseTime,
        response: formattedResponse
      };

      setLastRequest(requestRecord);
      setHistory(prev => [requestRecord, ...prev.slice(0, 9)]);

      if (response.ok) {
        toast.success(`Request successful (${response.status})`);
      } else {
        toast.error(`Request failed (${response.status})`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Request failed';
      setResponse(`Error: ${errorMessage}`);
      toast.error('Request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500/10 text-green-500';
      case 'POST': return 'bg-blue-500/10 text-blue-500';
      case 'PUT': return 'bg-yellow-500/10 text-yellow-500';
      case 'DELETE': return 'bg-red-500/10 text-red-500';
      default: return 'bg-muted';
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'bg-muted';
    if (status >= 200 && status < 300) return 'bg-green-500/10 text-green-600';
    if (status >= 400 && status < 500) return 'bg-yellow-500/10 text-yellow-600';
    if (status >= 500) return 'bg-red-500/10 text-red-600';
    return 'bg-muted';
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-14 sm:pb-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Request Builder */}
        <Card className="order-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
              <Code className="h-5 w-5 sm:h-6 sm:w-6" />
              Request Builder
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Configure and send API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API Key Selection */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">API Key</Label>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={selectedApiKey}
                onChange={(e) => setSelectedApiKey(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Method and Endpoint */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-3 space-y-2">
                <Label className="text-sm sm:text-base">Endpoint</Label>
                <Input
                  placeholder="/api/products"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="text-sm font-mono"
                />
              </div>
            </div>

            {/* Headers */}
            <div className="space-y-2">
              <Label className="text-sm sm:text-base">Headers (JSON)</Label>
              <Textarea
                placeholder='{"Content-Type": "application/json"}'
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                rows={3}
                className="font-mono text-xs sm:text-sm"
              />
            </div>

            {/* Request Body */}
            {method !== 'GET' && (
              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Request Body</Label>
                <Textarea
                  placeholder="Request body (JSON, form data, etc.)"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={6}
                  className="font-mono text-xs sm:text-sm"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button onClick={executeRequest} disabled={isLoading} className="w-full sm:flex-1">
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending...' : 'Send Request'}
              </Button>
              <Button variant="outline" onClick={saveRequest} className="w-full sm:w-auto">
                <Save className="h-4 w-4 sm:mr-0 mr-2" />
                <span className="sm:hidden">Save Request</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Response Viewer */}
        <Card className="order-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Response</CardTitle>
            <CardDescription>
              {lastRequest && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge className={`${getMethodColor(lastRequest.method)} text-xs`}>
                    {lastRequest.method}
                  </Badge>
                  <code className="text-xs break-all">{lastRequest.endpoint}</code>
                  {lastRequest.status && (
                    <Badge className={`${getStatusColor(lastRequest.status)} text-xs`}>
                      {lastRequest.status}
                    </Badge>
                  )}
                  {lastRequest.responseTime && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lastRequest.responseTime}ms
                    </span>
                  )}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {response ? (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="text-sm font-medium">Response Body</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(response)}
                    className="w-fit"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={response}
                  readOnly
                  rows={15}
                  className="font-mono text-xs resize-none"
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8 sm:py-12">
                <Code className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Send a request to see the response here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Presets and History */}
      <Card className="order-3">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
            <History className="h-5 w-5 sm:h-6 sm:w-6" />
            Presets & History
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Quick access to common requests and your testing history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="presets">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presets" className="text-sm">Presets</TabsTrigger>
              <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="presets" className="space-y-3">
              {presetRequests.map((preset) => (
                <div
                  key={preset.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => loadPreset(preset)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Badge className={`${getMethodColor(preset.method)} text-xs whitespace-nowrap`}>
                      {preset.method}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{preset.name}</div>
                      <code className="text-xs text-muted-foreground break-all">{preset.endpoint}</code>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="w-fit">
                    Load
                  </Button>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-6 sm:py-8">
                  <History className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No requests in history yet</p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => loadPreset(item)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Badge className={`${getMethodColor(item.method)} text-xs whitespace-nowrap`}>
                        {item.method}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.status && (
                        <Badge className={`${getStatusColor(item.status)} text-xs`}>
                          {item.status}
                        </Badge>
                      )}
                      {item.responseTime && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.responseTime}ms
                        </span>
                      )}
                      <Button variant="ghost" size="sm" className="w-fit">
                        Load
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
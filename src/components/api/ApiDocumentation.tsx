import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, Shield, Clock, Database, Users } from 'lucide-react';
import { toast } from 'sonner';

export const ApiDocumentation: React.FC = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/external/health',
      description: 'Health check for external API',
      permission: 'read',
      example: `curl -H "x-api-key: YOUR_API_KEY" \\
  https://your-domain.com/api/external/health`
    },
    {
      method: 'GET',
      path: '/api/external/products',
      description: 'Get all products with pagination',
      permission: 'read',
      example: `curl -H "x-api-key: YOUR_API_KEY" \\
  https://your-domain.com/api/external/products`
    },
    {
      method: 'GET',
      path: '/api/external/products/:id',
      description: 'Get single product by ID',
      permission: 'read',
      example: `curl -H "x-api-key: YOUR_API_KEY" \\
  https://your-domain.com/api/external/products/123`
    },
    {
      method: 'GET',
      path: '/api/external/products/meta/categories',
      description: 'Get all product categories',
      permission: 'read',
      example: `curl -H "x-api-key: YOUR_API_KEY" \\
  https://your-domain.com/api/external/products/meta/categories`
    },
    {
      method: 'GET',
      path: '/api/external/analytics/overview',
      description: 'Get analytics overview',
      permission: 'read',
      example: `curl -H "x-api-key: YOUR_API_KEY" \\
  https://your-domain.com/api/external/analytics/overview`
    },
    {
      method: 'GET',
      path: '/api/external/docs',
      description: 'Get API documentation',
      permission: 'read',
      example: `curl -H "x-api-key: YOUR_API_KEY" \\
  https://your-domain.com/api/external/docs`
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'POST': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'PUT': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted';
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'read': return 'bg-green-500/10 text-green-600';
      case 'write': return 'bg-blue-500/10 text-blue-600';
      case 'admin': return 'bg-red-500/10 text-red-600';
      case 'analytics': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-14 sm:pb-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Authentication */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
            Authentication
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            How to authenticate your API requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-3">
              Include your API key in the x-api-key header of every request:
            </p>
            <div className="bg-muted p-3 rounded-md font-mono text-xs sm:text-sm relative">
              <code className="break-all">x-api-key: YOUR_API_KEY</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard('x-api-key: YOUR_API_KEY')}
                className="absolute right-2 top-2 h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
            <div className="p-3 border rounded-lg">
              <h5 className="font-medium text-sm mb-1">Base URL</h5>
              <code className="text-xs text-muted-foreground break-all">https://your-domain.com/api/external</code>
            </div>
            <div className="p-3 border rounded-lg">
              <h5 className="font-medium text-sm mb-1">Content Type</h5>
              <code className="text-xs text-muted-foreground">application/json</code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6" />
            Rate Limits
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            API usage limits and best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary">1000</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Requests per hour</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-primary">429</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Status code when exceeded</div>
            </div>
            <div className="text-center p-4 border rounded-lg sm:col-span-2 lg:col-span-1">
              <div className="text-xl sm:text-2xl font-bold text-primary">60s</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Rate limit reset window</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
            <Database className="h-5 w-5 sm:h-6 sm:w-6" />
            Available Endpoints
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Complete list of API endpoints and their usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="border rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Badge className={`${getMethodColor(endpoint.method)} border w-fit`}>
                    {endpoint.method}
                  </Badge>
                  <code className="font-mono text-xs sm:text-sm break-all">{endpoint.path}</code>
                </div>
                <Badge variant="outline" className={`${getPermissionColor(endpoint.permission)} w-fit`}>
                  {endpoint.permission}
                </Badge>
              </div>
              
              <p className="text-xs sm:text-sm text-muted-foreground">{endpoint.description}</p>
              
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h5 className="text-sm font-medium">Example Request</h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint.example)}
                    className="h-6 text-xs w-fit"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  <code>{endpoint.example}</code>
                </pre>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Error Codes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">Error Codes</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Common HTTP status codes and their meanings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {[
              { code: '200', status: 'OK', description: 'Request successful' },
              { code: '201', status: 'Created', description: 'Resource created successfully' },
              { code: '400', status: 'Bad Request', description: 'Invalid request parameters' },
              { code: '401', status: 'Unauthorized', description: 'Invalid or missing API key' },
              { code: '403', status: 'Forbidden', description: 'Insufficient permissions' },
              { code: '404', status: 'Not Found', description: 'Resource not found' },
              { code: '429', status: 'Too Many Requests', description: 'Rate limit exceeded' },
              { code: '500', status: 'Internal Server Error', description: 'Server error occurred' }
            ].map((error) => (
              <div key={error.code} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 border rounded-lg">
                <Badge variant={error.code.startsWith('2') ? 'default' : 'destructive'} className="w-fit">
                  {error.code}
                </Badge>
                <div className="flex-1">
                  <div className="font-medium text-sm sm:text-base">{error.status}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{error.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* SDK & Examples */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center  sm:flex-row sm:items-center gap-2 text-lg sm:text-xl">
            <ExternalLink className="h-5 w-5 sm:h-6 sm:w-6" />
            SDKs & Examples
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Code examples and SDK integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-base sm:text-lg">JavaScript SDK</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                Official JavaScript client library
              </p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ExternalLink className="h-3 w-3 mr-1" />
                View on GitHub
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-base sm:text-lg">Python SDK</h4>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                Official Python client library
              </p>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <ExternalLink className="h-3 w-3 mr-1" />
                View on GitHub
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
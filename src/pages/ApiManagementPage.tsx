import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Eye,
  EyeOff,
  Plus,
  Copy,
  Trash2,
  RotateCcw,
  Activity,
  AlertTriangle,
  Check,
  Key,
  BookOpen,
  BarChart3,
  TestTube,
  Download,
  Calendar,
  MoreHorizontal,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  apiKeyService,
  type ApiKeyData,
  type CreateApiKeyRequest,
} from "@/services/apiKeyService";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import MainLayout from "@/components/layout/MainLayout";
import { ApiDocumentation } from "@/components/api/ApiDocumentation";
import { ApiMonitoringDashboard } from "@/components/api/ApiMonitoringDashboard";
import { ApiTester } from "@/components/api/ApiTester";

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (apiKey: string, keyName: string) => void;
}

interface ApiKeyCreatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  keyName: string;
}

interface ApiKeyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: ApiKeyData | null;
  onUpdate: () => void;
}

const ApiKeyCreatedDialog: React.FC<ApiKeyCreatedDialogProps> = ({
  open,
  onOpenChange,
  apiKey,
  keyName,
}) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };

  const downloadApiKey = () => {
    const apiKeyData = {
      name: keyName,
      key: apiKey,
      createdAt: new Date().toISOString(),
      note: "Keep this API key secure. You won't be able to see it again.",
    };
    const dataStr = JSON.stringify(apiKeyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${keyName
      .replace(/\s+/g, "_")
      .toLowerCase()}_api_key.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("API key downloaded successfully");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs sm:max-w-md lg:max-w-[500px] mx-2 sm:mx-auto">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            <span className="truncate">API Key Created Successfully</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Your API key "{keyName}" has been created. Copy it now as you won't
            be able to see it again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4">
          <Alert>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              <strong>Important:</strong> This is the only time you'll be able
              to copy this API key. Store it securely.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Your New API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                value={apiKey}
                readOnly
                className="font-mono text-xs sm:text-sm bg-muted pr-20"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="flex-shrink-0"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:pt-4">
          <Button
            variant="outline"
            onClick={downloadApiKey}
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Download JSON
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            I've Copied the Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const CreateApiKeyDialog: React.FC<CreateApiKeyDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<CreateApiKeyRequest>({
    name: "",
    permissions: [],
    rateLimit: 1000,
    expiresAt: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  const permissions = [
    {
      id: "read",
      label: "Read",
      description: "View products, inventory, and analytics",
    },
    {
      id: "write",
      label: "Write",
      description: "Create and update products and inventory",
    },
    {
      id: "admin",
      label: "Admin",
      description: "Full access to all resources",
    },
    {
      id: "analytics",
      label: "Analytics",
      description: "Access to analytics and reports",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.permissions.length === 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiKeyService.createApiKey(formData);
      onSuccess(
        (response.data as any)?.key ||
          "sk_live_••••••••••••••••••••••••••••••••",
        formData.name
      );
      onOpenChange(false);
      setFormData({
        name: "",
        permissions: [],
        rateLimit: 1000,
        expiresAt: undefined,
      });
    } catch (error) {
      toast.error("Failed to create API key");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission]
        : prev.permissions.filter((p) => p !== permission),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs sm:max-w-md lg:max-w-[500px] mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">
            Create New API Key
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Generate a new API key with specific permissions and rate limits.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">
              API Key Name *
            </Label>
            <Input
              id="name"
              placeholder="Enter API key name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm">Permissions *</Label>
            <div className="space-y-2 sm:space-y-3">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-start space-x-2 sm:space-x-3"
                >
                  <Checkbox
                    id={permission.id}
                    checked={formData.permissions.includes(permission.id)}
                    onCheckedChange={(checked) =>
                      handlePermissionChange(permission.id, checked as boolean)
                    }
                  />
                  <div className="grid gap-1 leading-none min-w-0 flex-1">
                    <Label
                      htmlFor={permission.id}
                      className="text-xs sm:text-sm font-medium"
                    >
                      {permission.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="rateLimit" className="text-xs sm:text-sm">
                Rate Limit (req/hour)
              </Label>
              <Input
                id="rateLimit"
                type="number"
                min="1"
                value={formData.rateLimit}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rateLimit: parseInt(e.target.value) || 1000,
                  }))
                }
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt" className="text-xs sm:text-sm">
                Expiration (Optional)
              </Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={formData.expiresAt || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expiresAt: e.target.value || undefined,
                  }))
                }
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              size="sm"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {isLoading ? "Creating..." : "Create API Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ApiKeyDetailDialog: React.FC<ApiKeyDetailDialogProps> = ({
  open,
  onOpenChange,
  apiKey,
  onUpdate,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!apiKey) return null;

  const handleToggleStatus = async () => {
    setIsLoading(true);
    try {
      await apiKeyService.toggleApiKeyStatus(apiKey.id);
      toast.success(
        `API key ${apiKey.isActive ? "disabled" : "enabled"} successfully`
      );
      onUpdate();
    } catch (error) {
      toast.error("Failed to update API key status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this API key? This action cannot be undone."
      )
    ) {
      return;
    }
    setIsLoading(true);
    try {
      await apiKeyService.deleteApiKey(apiKey.id);
      toast.success("API key deleted successfully");
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete API key");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xs sm:max-w-md lg:max-w-[600px] mx-2 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-3 sm:pb-4">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="truncate text-base sm:text-lg">{apiKey.name}</span>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge
                variant={apiKey.isActive ? "default" : "secondary"}
                className="text-xs"
              >
                {apiKey.isActive ? "Active" : "Inactive"}
              </Badge>
              {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )}
            </div>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Created: {new Date(apiKey.createdAt).toLocaleDateString()}
            {apiKey.lastUsed && (
              <>
                {" "}
                • Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* API Key Display */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey.key || "sk_live_••••••••••••••••••••••••••••••••"}
                readOnly
                className="font-mono text-xs sm:text-sm flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="flex-shrink-0"
              >
                {showKey ? (
                  <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiKey.key || "")}
                className="flex-shrink-0"
              >
                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Permissions</Label>
            <div className="flex flex-wrap gap-1">
              {apiKey.permissions.map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                Usage Count
              </Label>
              <div className="text-base sm:text-lg font-medium">
                {apiKey.usageCount.toLocaleString()}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">
                Rate Limit
              </Label>
              <div className="text-base sm:text-lg font-medium">
                {apiKey.rateLimit}/hour
              </div>
            </div>
            {apiKey.expiresAt && (
              <div className="col-span-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Expires At
                </Label>
                <div className="text-base sm:text-lg font-medium">
                  {new Date(apiKey.expiresAt).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
          <Button
            variant="outline"
            onClick={handleToggleStatus}
            disabled={isLoading}
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            {apiKey.isActive ? "Disable" : "Enable"}
          </Button>

          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-destructive hover:text-destructive w-full sm:w-auto text-xs sm:text-sm"
            size="sm"
          >
            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface ApiKeyTableProps {
  apiKeys: ApiKeyData[];
  isLoading: boolean;
  onUpdate: () => void;
}

const ApiKeyTable: React.FC<ApiKeyTableProps> = ({
  apiKeys,
  isLoading,
  onUpdate,
}) => {
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKeyData | null>(null);

  const handleRowClick = (apiKey: ApiKeyData) => {
    setSelectedApiKey(apiKey);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center space-x-4 animate-pulse"
              >
                <div className="h-3 sm:h-4 bg-muted rounded w-1/4"></div>
                <div className="h-3 sm:h-4 bg-muted rounded w-1/6"></div>
                <div className="h-3 sm:h-4 bg-muted rounded w-1/6"></div>
                <div className="h-3 sm:h-4 bg-muted rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (apiKeys.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8 sm:py-12">
          <Activity className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-base sm:text-lg font-medium mb-2">
            No API Keys Found
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first API key to start integrating with external
            services.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">
                    Permissions
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">
                    Usage
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">
                    Last Used
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm hidden lg:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow
                    key={apiKey.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(apiKey)}
                  >
                    <TableCell className="font-medium text-xs sm:text-sm">
                      <div className="truncate max-w-32 sm:max-w-none">
                        {apiKey.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <Badge
                          variant={apiKey.isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {apiKey.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {apiKey.expiresAt &&
                          new Date(apiKey.expiresAt) < new Date() && (
                            <Badge variant="destructive" className="text-xs">
                              Expired
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {apiKey.permissions.slice(0, 2).map((permission) => (
                          <Badge
                            key={permission}
                            variant="outline"
                            className="text-xs"
                          >
                            {permission}
                          </Badge>
                        ))}
                        {apiKey.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{apiKey.permissions.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs sm:text-sm">
                      {apiKey.usageCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs sm:text-sm">
                      {apiKey.lastUsed
                        ? new Date(apiKey.lastUsed).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs sm:text-sm">
                      {new Date(apiKey.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 sm:h-8 sm:w-8"
                          >
                            <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRowClick(apiKey);
                            }}
                            className="text-xs sm:text-sm"
                          >
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ApiKeyDetailDialog
        open={!!selectedApiKey}
        onOpenChange={(open) => !open && setSelectedApiKey(null)}
        apiKey={selectedApiKey}
        onUpdate={onUpdate}
      />
    </>
  );
};

const ApiManagementPage: React.FC = () => {
  const { user } = useApp();
  const [apiKeys, setApiKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<{
    key: string;
    name: string;
  } | null>(null);

  const fetchApiKeys = async () => {
    try {
      const response = await apiKeyService.getApiKeys();
      setApiKeys((response.data as ApiKeyData[]) || []);
    } catch (error) {
      toast.error("Failed to fetch API keys");
      console.error("Error fetching API keys:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleTestApi = async (apiKey: string) => {
    try {
      const result = await apiKeyService.testExternalApi(apiKey);
      if (result.success) {
        toast.success("API key test successful");
      } else {
        toast.error("API key test failed");
      }
    } catch (error) {
      toast.error("API key test failed");
    }
  };

  if (user?.role !== "superadmin") {
    return (
      <MainLayout>
        <div className="container mx-auto p-4 sm:p-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Access denied. Super admin privileges required.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className=" mx-auto  sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
              API Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage API keys, documentation, monitoring, and testing for
              external integrations.
            </p>
          </div>
        </div>

        <Tabs defaultValue="keys" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger
              value="keys"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2"
            >
              <Key className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">API Keys</span>
              <span className="xs:hidden">Keys</span>
            </TabsTrigger>
            <TabsTrigger
              value="docs"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2"
            >
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Documentation</span>
              <span className="xs:hidden">Docs</span>
            </TabsTrigger>
            <TabsTrigger
              value="monitoring"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Monitoring</span>
              <span className="sm:hidden">Monitor</span>
            </TabsTrigger>
            <TabsTrigger
              value="testing"
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2"
            >
              <TestTube className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Testing</span>
              <span className="xs:hidden">Test</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="keys" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">API Keys</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Create and manage API keys for external access.
                </p>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create API Key
              </Button>
            </div>

            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <ApiKeyTable
                apiKeys={apiKeys}
                isLoading={isLoading}
                onUpdate={fetchApiKeys}
              />
            )}
          </TabsContent>

          <TabsContent value="docs">
            <ApiDocumentation />
          </TabsContent>

          <TabsContent value="monitoring">
            <ApiMonitoringDashboard />
          </TabsContent>

          <TabsContent value="testing">
            <ApiTester />
          </TabsContent>
        </Tabs>

        <CreateApiKeyDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={(apiKey, keyName) => {
            setCreatedApiKey({
              key: apiKey,
              name: keyName,
            });
            fetchApiKeys();
          }}
        />

        <ApiKeyCreatedDialog
          open={!!createdApiKey}
          onOpenChange={() => setCreatedApiKey(null)}
          apiKey={createdApiKey?.key || ""}
          keyName={createdApiKey?.name || ""}
        />
      </div>
    </MainLayout>
  );
};
export default ApiManagementPage;

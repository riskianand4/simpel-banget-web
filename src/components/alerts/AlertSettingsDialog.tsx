import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertSettings, AlertThreshold } from '@/types/alert-settings';
import { useAuth } from '@/hooks/useAuth';

interface AlertSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AlertSettings | null;
  onSave: (settings: Partial<AlertSettings>) => void;
}

const AlertSettingsDialog: React.FC<AlertSettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSave,
}) => {
  const { user } = useAuth();
  const [editingSettings, setEditingSettings] = useState<AlertSettings | null>(settings);

  const canEdit = user?.role === 'superadmin';

  React.useEffect(() => {
    setEditingSettings(settings);
  }, [settings]);

  if (!editingSettings) return null;

  const updateThreshold = (index: number, updates: Partial<AlertThreshold>) => {
    const newThresholds = [...editingSettings.thresholds];
    newThresholds[index] = { ...newThresholds[index], ...updates };
    setEditingSettings({
      ...editingSettings,
      thresholds: newThresholds,
    });
  };

  const addThreshold = () => {
    const newThreshold: AlertThreshold = {
      id: `threshold-${Date.now()}`,
      type: 'low_stock',
      name: 'Threshold Baru',
      description: 'Deskripsi threshold',
      enabled: true,
      threshold: 20,
      severity: 'MEDIUM',
      conditions: {
        checkPercentage: true,
        checkAbsolute: false,
      },
    };
    
    setEditingSettings({
      ...editingSettings,
      thresholds: [...editingSettings.thresholds, newThreshold],
    });
  };

  const removeThreshold = (index: number) => {
    const newThresholds = editingSettings.thresholds.filter((_, i) => i !== index);
    setEditingSettings({
      ...editingSettings,
      thresholds: newThresholds,
    });
  };

  const handleSave = () => {
    onSave(editingSettings);
    onOpenChange(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'secondary';
      case 'LOW': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Pengaturan Alert Otomatis
            {!canEdit && (
              <Badge variant="outline" className="text-xs">
                View Only
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!canEdit && (
            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Hanya Superadmin yang dapat mengubah pengaturan alert
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pengaturan Notifikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif">Email Notifications</Label>
                <Switch
                  id="email-notif"
                  checked={editingSettings.notifications.email}
                  onCheckedChange={(checked) =>
                    setEditingSettings({
                      ...editingSettings,
                      notifications: {
                        ...editingSettings.notifications,
                        email: checked,
                      },
                    })
                  }
                  disabled={!canEdit}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="app-notif">In-App Notifications</Label>
                <Switch
                  id="app-notif"
                  checked={editingSettings.notifications.inApp}
                  onCheckedChange={(checked) =>
                    setEditingSettings({
                      ...editingSettings,
                      notifications: {
                        ...editingSettings.notifications,
                        inApp: checked,
                      },
                    })
                  }
                  disabled={!canEdit}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-notif">Sound Alerts</Label>
                <Switch
                  id="sound-notif"
                  checked={editingSettings.notifications.sound}
                  onCheckedChange={(checked) =>
                    setEditingSettings({
                      ...editingSettings,
                      notifications: {
                        ...editingSettings.notifications,
                        sound: checked,
                      },
                    })
                  }
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          {/* Auto Acknowledge Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Auto Acknowledge</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-ack">Enable Auto Acknowledge</Label>
                <Switch
                  id="auto-ack"
                  checked={editingSettings.autoAcknowledge.enabled}
                  onCheckedChange={(checked) =>
                    setEditingSettings({
                      ...editingSettings,
                      autoAcknowledge: {
                        ...editingSettings.autoAcknowledge,
                        enabled: checked,
                      },
                    })
                  }
                  disabled={!canEdit}
                />
              </div>
              
              {editingSettings.autoAcknowledge.enabled && (
                <div className="space-y-2">
                  <Label htmlFor="ack-hours">Auto acknowledge after (hours)</Label>
                  <Input
                    id="ack-hours"
                    type="number"
                    value={editingSettings.autoAcknowledge.afterHours}
                    onChange={(e) =>
                      setEditingSettings({
                        ...editingSettings,
                        autoAcknowledge: {
                          ...editingSettings.autoAcknowledge,
                          afterHours: parseInt(e.target.value) || 24,
                        },
                      })
                    }
                    disabled={!canEdit}
                    min="1"
                    max="168"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Alert Thresholds */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Alert Thresholds</CardTitle>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addThreshold}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Threshold
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {editingSettings.thresholds.map((threshold, index) => (
                <motion.div
                  key={threshold.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(threshold.severity) as any}>
                        {threshold.severity}
                      </Badge>
                      <span className="font-medium">{threshold.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={threshold.enabled}
                        onCheckedChange={(checked) =>
                          updateThreshold(index, { enabled: checked })
                        }
                        disabled={!canEdit}
                      />
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeThreshold(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama</Label>
                      <Input
                        value={threshold.name}
                        onChange={(e) =>
                          updateThreshold(index, { name: e.target.value })
                        }
                        disabled={!canEdit}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tipe</Label>
                      <Select
                        value={threshold.type}
                        onValueChange={(value: any) =>
                          updateThreshold(index, { type: value })
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low_stock">Low Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                          <SelectItem value="overstocked">Overstocked</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Threshold (%)</Label>
                      <Input
                        type="number"
                        value={threshold.threshold}
                        onChange={(e) =>
                          updateThreshold(index, { threshold: parseInt(e.target.value) || 0 })
                        }
                        disabled={!canEdit}
                        min="0"
                        max="100"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Severity</Label>
                      <Select
                        value={threshold.severity}
                        onValueChange={(value: any) =>
                          updateThreshold(index, { severity: value })
                        }
                        disabled={!canEdit}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Input
                      value={threshold.description}
                      onChange={(e) =>
                        updateThreshold(index, { description: e.target.value })
                      }
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={threshold.conditions.checkPercentage}
                        onCheckedChange={(checked) =>
                          updateThreshold(index, {
                            conditions: {
                              ...threshold.conditions,
                              checkPercentage: checked,
                            },
                          })
                        }
                        disabled={!canEdit}
                      />
                      <Label>Check Percentage</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={threshold.conditions.checkAbsolute}
                        onCheckedChange={(checked) =>
                          updateThreshold(index, {
                            conditions: {
                              ...threshold.conditions,
                              checkAbsolute: checked,
                            },
                          })
                        }
                        disabled={!canEdit}
                      />
                      <Label>Check Absolute Value</Label>
                    </div>
                  </div>

                  {threshold.conditions.checkAbsolute && (
                    <div className="space-y-2">
                      <Label>Absolute Value</Label>
                      <Input
                        type="number"
                        value={threshold.conditions.absoluteValue || 0}
                        onChange={(e) =>
                          updateThreshold(index, {
                            conditions: {
                              ...threshold.conditions,
                              absoluteValue: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        disabled={!canEdit}
                        min="0"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          {canEdit && (
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertSettingsDialog;
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Package, DollarSign, Calendar, Target, Brain, Zap } from 'lucide-react';
import { useProductManager } from '@/hooks/useProductManager';

interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQty: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  confidence: number;
  reasons: string[];
  estimatedCost: number;
  leadTime: number;
  daysUntilOutOfStock: number;
  turnoverRate: number;
  category: string;
}

export default function SmartReorderEngine() {
  const { products } = useProductManager();
  const [reorderSuggestions, setReorderSuggestions] = useState<ReorderSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateReorderSuggestions = () => {
    try {
      if (!products?.length) {
        setLoading(false);
        return;
      }

      const suggestions: ReorderSuggestion[] = products.map((product) => {
        const currentStock = (product as any).quantity || (product as any).stock?.current || 0;
        const minStock = (product as any).minStock || (product as any).stock?.minimum || 10;
        const dailyMovement = Math.max(1, Math.round(minStock / 7));
        const daysInStock = Math.max(1, Math.round(currentStock / dailyMovement));
        const leadTime = 7;
        const reorderPoint = (dailyMovement * leadTime) + (dailyMovement * 3);
        const suggestedQty = Math.max(minStock, minStock * 2);

        let priority: 'urgent' | 'high' | 'medium' | 'low' = 'low';
        if (currentStock <= minStock * 0.5) priority = 'urgent';
        else if (currentStock <= minStock) priority = 'high';
        else if (currentStock <= minStock * 1.5) priority = 'medium';

        const reasons = [];
        if (currentStock <= minStock) reasons.push("Below minimum stock level");
        if (currentStock < reorderPoint) reasons.push("Below calculated reorder point");

        return {
          productId: (product as any)._id || (product as any).id,
          productName: product.name,
          currentStock,
          reorderPoint,
          suggestedQty,
          priority,
          confidence: 0.85,
          reasons,
          estimatedCost: suggestedQty * product.price,
          leadTime,
          daysUntilOutOfStock: daysInStock,
          turnoverRate: 10,
          category: product.category
        };
      }).filter(s => s.priority !== 'low');

      setReorderSuggestions(suggestions);
      setLoading(false);
    } catch (err) {
      setError('Failed to generate reorder suggestions');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (products?.length) {
      generateReorderSuggestions();
    }
  }, [products]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Smart Reorder Engine</h2>
      </div>
      
      {reorderSuggestions.map((suggestion) => (
        <Card key={suggestion.productId}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{suggestion.productName}</CardTitle>
                <CardDescription>{suggestion.category}</CardDescription>
              </div>
              <Badge variant={suggestion.priority === 'urgent' ? 'destructive' : 'default'}>
                {suggestion.priority}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Stock</p>
                <p className="font-semibold">{suggestion.currentStock}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suggested Qty</p>
                <p className="font-semibold">{suggestion.suggestedQty}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Cost</p>
                <p className="font-semibold">Rp {suggestion.estimatedCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Days Left</p>
                <p className="font-semibold">{suggestion.daysUntilOutOfStock}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Reasons:</p>
              <ul className="text-sm">
                {suggestion.reasons.map((reason, idx) => (
                  <li key={idx}>• {reason}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
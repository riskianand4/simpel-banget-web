import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProductManager } from '@/hooks/useProductManager';

export function ROIAnalysis() {
  const { products } = useProductManager();

  return (
    <Card>
      <CardHeader>
        <CardTitle>ROI Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <p>ROI analysis for {products?.length || 0} products will be available with enhanced analytics.</p>
      </CardContent>
    </Card>
  );
}
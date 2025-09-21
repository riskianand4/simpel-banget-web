import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, X, CheckCircle } from 'lucide-react';
import { SKUConflict } from '@/services/skuValidationApi';

interface ParsedProduct {
  name: string;
  sku: string;
  category: string;
  rowIndex: number;
  skuConflict?: SKUConflict;
  originalSKU?: string;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface SKUConflictResolverProps {
  products: ParsedProduct[];
  onResolveConflict: (productIndex: number, action: 'generate' | 'skip') => void;
  onResolveAll: (action: 'generate' | 'skip') => void;
  onContinue: () => void;
}

export const SKUConflictResolver: React.FC<SKUConflictResolverProps> = ({
  products,
  onResolveConflict,
  onResolveAll,
  onContinue,
}) => {
  const conflictProducts = products.filter(p => p.skuConflict);
  const hasUnresolvedConflicts = conflictProducts.length > 0;

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Ditemukan {conflictProducts.length} SKU yang sudah ada:</p>
            <p className="text-sm">
              SKU berikut sudah terdaftar di sistem. Pilih tindakan untuk setiap produk atau gunakan aksi massal.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {hasUnresolvedConflicts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resolusi Konflik SKU</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolveAll('generate')}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate Semua
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolveAll('skip')}
                  className="text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Lewati Semua
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Baris</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>SKU Konflik</TableHead>
                    <TableHead>Produk Existing</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflictProducts.map((product, index) => {
                    const productIndex = products.findIndex(p => p.rowIndex === product.rowIndex);
                    return (
                      <TableRow key={product.rowIndex}>
                        <TableCell>{product.rowIndex}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{product.sku}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{product.skuConflict?.existingProduct.name}</div>
                            <div className="text-muted-foreground">{product.skuConflict?.existingProduct.sku}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onResolveConflict(productIndex, 'generate')}
                              className="text-xs"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Generate
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onResolveConflict(productIndex, 'skip')}
                              className="text-xs"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Lewati
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasUnresolvedConflicts && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Semua konflik SKU telah diselesaikan. Anda dapat melanjutkan untuk mengimpor data.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={onContinue}
          disabled={hasUnresolvedConflicts}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Lanjutkan ke Preview
        </Button>
      </div>
    </div>
  );
};
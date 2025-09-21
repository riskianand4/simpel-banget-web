import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, X, CheckCircle } from 'lucide-react';

interface ImportError {
  productIndex: number;
  sku: string;
  name: string;
  error: string;
  suggestion?: string;
}

interface ImportErrorResolverProps {
  errors: ImportError[];
  onRetryWithFix: (productIndex: number, newSKU?: string) => void;
  onSkipProduct: (productIndex: number) => void;
  onResolveAll: (action: 'fix' | 'skip') => void;
  onContinue: () => void;
}

export const ImportProductErrorResolver: React.FC<ImportErrorResolverProps> = ({
  errors,
  onRetryWithFix,
  onSkipProduct,
  onResolveAll,
  onContinue,
}) => {
  const hasErrors = errors.length > 0;

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">Ditemukan {errors.length} error saat import:</p>
            <p className="text-sm">
              Produk berikut gagal diimpor. Pilih tindakan untuk setiap produk atau gunakan aksi massal.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {hasErrors && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Resolusi Error Import</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResolveAll('fix')}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Perbaiki Semua
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
                    <TableHead>Nama Produk</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Saran</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error, index) => (
                    <TableRow key={error.productIndex}>
                      <TableCell className="font-medium">{error.name}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{error.sku}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-red-600">{error.error}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {error.suggestion || 'Generate SKU baru'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRetryWithFix(error.productIndex)}
                            className="text-xs"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Perbaiki
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSkipProduct(error.productIndex)}
                            className="text-xs"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Lewati
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!hasErrors && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Semua error telah diselesaikan. Import berhasil diselesaikan.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button 
          onClick={onContinue}
          disabled={hasErrors}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          Selesai
        </Button>
      </div>
    </div>
  );
};
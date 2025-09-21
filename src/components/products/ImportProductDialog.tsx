import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, X, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Product } from '@/types/inventory';
import { useSKUValidation, SKUConflict } from '@/services/skuValidationApi';
import { SKUConflictResolver } from './SKUConflictResolver';

interface ImportProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

interface ImportValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface ParsedProduct extends Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
  rowIndex: number;
  validation: ImportValidation;
  skuConflict?: SKUConflict;
  originalSKU?: string;
}

export const ImportProductDialog: React.FC<ImportProductDialogProps> = ({
  isOpen,
  onOpenChange,
  onImport,
}) => {
  const { validateSKUs, generateUniqueSKU } = useSKUValidation();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'conflicts' | 'importing'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [skuConflicts, setSKUConflicts] = useState<SKUConflict[]>([]);
  const [isValidatingSKUs, setIsValidatingSKUs] = useState(false);
  
  // Ref untuk input file
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Column mapping untuk fleksibilitas format file
  const columnMappings = {
    // Nama produk - required
    name: ['name', 'nama', 'nama produk', 'product name', 'nama_produk'],
    // SKU - required
    sku: ['sku', 'kode', 'code', 'kode produk', 'product code'],
    // Kategori - required
    category: ['category', 'kategori', 'cat'],
    // Harga - optional
    price: ['price', 'harga', 'price_idr', 'harga_jual'],
    // Stok - required
    stock: ['stock', 'stok', 'qty', 'quantity', 'jumlah'],
    // Stok minimum - optional (default 5)
    minStock: ['min_stock', 'stok_min', 'minimum_stock', 'min stock', 'stok minimum'],
    // Status - optional (default 'active')
    status: ['status', 'aktif', 'active'],
    // Lokasi - optional
    location: ['location', 'lokasi', 'gudang', 'warehouse'],
    // Supplier - optional
    supplier: ['supplier', 'pemasok', 'vendor'],
    // Unit - optional
    unit: ['unit', 'satuan', 'uom'],
    // Deskripsi - optional
    description: ['description', 'deskripsi', 'keterangan', 'desc']
  };

  const validateRow = (row: any, index: number): ImportValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!row.name || !row.name.toString().trim()) {
      errors.push('Nama produk wajib diisi');
    }
    if (!row.sku || !row.sku.toString().trim()) {
      errors.push('SKU wajib diisi');
    }
    if (!row.category || !row.category.toString().trim()) {
      errors.push('Kategori wajib diisi');
    }
    if (!row.stock && row.stock !== 0) {
      errors.push('Stok wajib diisi');
    } else if (isNaN(Number(row.stock)) || Number(row.stock) < 0) {
      errors.push('Stok harus berupa angka positif');
    }

    // Optional fields validation
    if (row.price && (isNaN(Number(row.price)) || Number(row.price) < 0)) {
      errors.push('Harga harus berupa angka positif');
    }
    if (row.minStock && (isNaN(Number(row.minStock)) || Number(row.minStock) < 0)) {
      errors.push('Stok minimum harus berupa angka positif');
    }

    // Warnings
    if (!row.price) {
      warnings.push('Harga tidak diisi (akan diset ke 0)');
    }
    if (!row.minStock) {
      warnings.push('Stok minimum tidak diisi (akan diset ke 5)');
    }
    if (row.status && !['active', 'inactive', 'discontinued'].includes(row.status.toLowerCase())) {
      warnings.push('Status tidak valid, akan diset ke "active"');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  };

  const mapColumnNames = (headers: string[]): Record<string, string> => {
    const mapping: Record<string, string> = {};
    
    Object.entries(columnMappings).forEach(([field, possibleNames]) => {
      const matchedHeader = headers.find(header => 
        possibleNames.some(name => 
          header.toLowerCase().trim() === name.toLowerCase()
        )
      );
      if (matchedHeader) {
        mapping[matchedHeader] = field;
      }
    });

    return mapping;
  };

  const parseFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress(0);

    try {
      const data = await file.arrayBuffer();
      setProgress(25);

      let workbook: XLSX.WorkBook;
      
      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(data);
        workbook = XLSX.read(text, { type: 'string' });
      } else {
        workbook = XLSX.read(data);
      }

      setProgress(50);

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      setProgress(75);

      if (jsonData.length === 0) {
        throw new Error('File kosong atau tidak ada data');
      }

      // Map kolom berdasarkan header yang ada
      const headers = Object.keys(jsonData[0] as object);
      const columnMapping = mapColumnNames(headers);

      const parsed: ParsedProduct[] = jsonData.map((row: any, index) => {
        // Mapping kolom ke field yang benar
        const mappedRow: any = {};
        Object.entries(row).forEach(([header, value]) => {
          const field = columnMapping[header];
          if (field) {
            mappedRow[field] = value;
          }
        });

        // Set default values
        const product = {
          name: mappedRow.name?.toString().trim() || '',
          sku: mappedRow.sku?.toString().trim() || '',
          category: mappedRow.category?.toString().trim() || '',
          price: mappedRow.price ? Number(mappedRow.price) : 0,
          stock: Number(mappedRow.stock) || 0,
          minStock: mappedRow.minStock ? Number(mappedRow.minStock) : 5,
          status: (['active', 'inactive', 'discontinued'].includes(mappedRow.status?.toLowerCase())) 
            ? mappedRow.status.toLowerCase() as 'active' | 'inactive' | 'discontinued'
            : 'active' as 'active',
          location: mappedRow.location?.toString().trim() || '',
          supplier: mappedRow.supplier?.toString().trim() || '',
          unit: mappedRow.unit?.toString().trim() || 'pcs',
          description: mappedRow.description?.toString().trim() || '',
          rowIndex: index + 2, // +2 karena header di baris 1 dan data mulai baris 2
          validation: validateRow(mappedRow, index)
        };

        return product;
      });

      setParsedData(parsed);
      
      // Validate SKUs if we have valid products
      const validProducts = parsed.filter(p => p.validation.valid);
      if (validProducts.length > 0) {
        await validateProductSKUs(parsed);
      } else {
        setStep('preview');
      }
      
      setProgress(100);
      
      const validCount = parsed.filter(p => p.validation.valid).length;
      toast.success(`Berhasil memproses ${parsed.length} baris data. ${validCount} valid, ${parsed.length - validCount} error.`);

    } catch (error) {
      toast.error(`Gagal memproses file: ${error instanceof Error ? error.message : 'Error tidak dikenal'}`);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv' // csv
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV.');
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  // Fungsi untuk trigger file input click
  const triggerFileInput = () => {
    try {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        toast.error('Error: File input tidak tersedia');
      }
    } catch (error) {
      toast.error('Error: Tidak dapat membuka file picker');
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // File drop handled silently
      
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'application/vnd.ms-excel', // xls
        'text/csv' // csv
      ];

      if (!validTypes.includes(droppedFile.type)) {
        toast.error('Format file tidak didukung. Gunakan Excel (.xlsx, .xls) atau CSV.');
        return;
      }

      setFile(droppedFile);
      parseFile(droppedFile);
    }
  }, [parseFile]);

  // Validate SKUs against existing products
  const validateProductSKUs = async (products: ParsedProduct[]) => {
    setIsValidatingSKUs(true);
    try {
      const validProducts = products.filter(p => p.validation.valid);
      const skus = validProducts.map(p => p.sku);
      
      const validation = await validateSKUs(skus);
      
      if (validation.hasConflicts) {
        setSKUConflicts(validation.conflicts);
        
        // Mark products with conflicts
        const updatedProducts = products.map(product => {
          const conflict = validation.conflicts.find(c => c.sku === product.sku.toUpperCase());
          return conflict ? { ...product, skuConflict: conflict, originalSKU: product.sku } : product;
        });
        
        setParsedData(updatedProducts);
        setStep('conflicts');
      } else {
        setStep('preview');
      }
    } catch (error) {
      toast.error('Gagal memvalidasi SKU. Melanjutkan tanpa validasi.');
      setStep('preview');
    } finally {
      setIsValidatingSKUs(false);
    }
  };

  // Resolve SKU conflict by generating new SKU
  const resolveSKUConflict = (productIndex: number, action: 'generate' | 'skip') => {
    setParsedData(prev => prev.map((product, index) => {
      if (index === productIndex && product.skuConflict) {
        if (action === 'generate') {
          const existingSKUs = prev.map(p => p.sku.toUpperCase());
          const newSKU = generateUniqueSKU(product.originalSKU || product.sku, existingSKUs);
          return {
            ...product,
            sku: newSKU,
            skuConflict: undefined
          };
        } else {
          // Skip - mark as invalid
          return {
            ...product,
            validation: {
              ...product.validation,
              valid: false,
              errors: [...product.validation.errors, 'Dilewati karena SKU duplikat']
            }
          };
        }
      }
      return product;
    }));
  };

  // Resolve all conflicts at once
  const resolveAllConflicts = (action: 'generate' | 'skip') => {
    setParsedData(prev => prev.map(product => {
      if (product.skuConflict) {
        if (action === 'generate') {
          const existingSKUs = prev.map(p => p.sku.toUpperCase());
          const newSKU = generateUniqueSKU(product.originalSKU || product.sku, existingSKUs);
          return {
            ...product,
            sku: newSKU,
            skuConflict: undefined
          };
        } else {
          return {
            ...product,
            validation: {
              ...product.validation,
              valid: false,
              errors: [...product.validation.errors, 'Dilewati karena SKU duplikat']
            }
          };
        }
      }
      return product;
    }));
  };

  const handleImport = async () => {
    const validProducts = parsedData.filter(p => p.validation.valid && !p.skuConflict);
    
    if (validProducts.length === 0) {
      toast.error('Tidak ada data valid untuk diimpor');
      return;
    }

    setStep('importing');
    setProgress(0);

    try {
      // Remove validation, rowIndex, skuConflict, dan originalSKU dari data sebelum kirim
      const productsToImport = validProducts.map(({ validation, rowIndex, skuConflict, originalSKU, ...product }) => product);
      
      await onImport(productsToImport);
      
      toast.success(`Berhasil mengimpor ${validProducts.length} produk`);
      
      // Reset state
      setFile(null);
      setParsedData([]);
      setSKUConflicts([]);
      setStep('upload');
      setProgress(0);
      onOpenChange(false);
      
    } catch (error) {
      toast.error(`Gagal mengimpor data: ${error instanceof Error ? error.message : 'Error tidak dikenal'}`);
    }
  };

  const downloadTemplate = () => {
    const timestamp = new Date().getTime();
    const templateData = [{
      'Nama Produk': 'Contoh Laptop Gaming',
      'SKU': `LPT-${timestamp.toString().slice(-3)}`,
      'Kategori': 'Elektronik',
      'Harga': 15000000,
      'Stok': 10,
      'Stok Minimum': 2,
      'Status': 'active',
      'Lokasi': 'Gudang A',
      'Supplier': 'PT Tech Supplier',
      'Satuan': 'unit',
      'Deskripsi': 'Laptop gaming dengan spesifikasi tinggi'
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'template_import_produk.xlsx');
  };

  const resetDialog = () => {
    setFile(null);
    setParsedData([]);
    setSKUConflicts([]);
    setStep('upload');
    setProgress(0);
    setIsProcessing(false);
    setIsValidatingSKUs(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validCount = parsedData.filter(p => p.validation.valid && !p.skuConflict).length;
  const errorCount = parsedData.filter(p => !p.validation.valid).length;
  const conflictCount = parsedData.filter(p => p.skuConflict).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-hidden z-50 p-4 md:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
              <FileSpreadsheet className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Import Data Produk</span>
              <span className="sm:hidden">Import Produk</span>
            </DialogTitle>
            <DialogDescription className="text-xs md:text-sm">
              Impor data produk dari file Excel (.xlsx, .xls) atau CSV. 
              {import.meta.env.DEV && ' [DEV: File input debugging enabled]'}
            </DialogDescription>
          </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {step === 'upload' && (
            <div className="space-y-3 md:space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center transition-colors relative z-10 ${
                  dragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/40'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Upload className={`w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="space-y-1 md:space-y-2">
                  <p className="text-base md:text-lg font-medium">
                    {dragActive ? 'Lepaskan file di sini' : 'Pilih file atau drag & drop'}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Mendukung format Excel (.xlsx, .xls) dan CSV
                  </p>
                </div>
                <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
                  {/* Hidden file input dengan ref yang jelas */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    disabled={isProcessing}
                    tabIndex={-1}
                  />
                  
                  {/* Visible button yang trigger file input */}
                  <Button 
                    onClick={triggerFileInput}
                    variant="outline" 
                    size="sm"
                    className="relative z-20 min-w-[120px] md:min-w-[140px] hover:bg-accent hover:text-accent-foreground transition-colors text-xs md:text-sm"
                    disabled={isProcessing}
                    type="button"
                  >
                    <Upload className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    {isProcessing ? 'Memproses...' : 'Pilih File'}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground">
                    Format yang didukung: .xlsx, .xls, .csv (Maksimal 10MB)
                  </p>
                </div>
              </div>

              {(isProcessing || isValidatingSKUs) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span>{isValidatingSKUs ? 'Memvalidasi SKU...' : 'Memproses file...'}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Alert>
                <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                <AlertDescription className="text-xs md:text-sm">
                  <strong>Kolom yang dibutuhkan:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-0.5 md:space-y-1 text-xs">
                    <li><strong>Nama Produk</strong> (wajib) - Nama produk</li>
                    <li><strong>SKU</strong> (wajib) - Kode unik produk</li>
                    <li><strong>Kategori</strong> (wajib) - Kategori produk</li>
                    <li><strong>Stok</strong> (wajib) - Jumlah stok tersedia</li>
                    <li><strong>Harga</strong> (opsional) - Harga jual produk</li>
                    <li><strong>Stok Minimum</strong> (opsional) - Batas minimum stok</li>
                    <li className="hidden sm:list-item"><strong>Status, Lokasi, Supplier, Satuan, Deskripsi</strong> (opsional)</li>
                    <li className="sm:hidden"><strong>Dll.</strong> (opsional)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex justify-center">
                <Button variant="outline" onClick={downloadTemplate} size="sm" className="text-xs md:text-sm">
                  <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  <span className="hidden sm:inline">Download Template</span>
                  <span className="sm:hidden">Template</span>
                </Button>
              </div>
            </div>
          )}

          {step === 'conflicts' && (
            <SKUConflictResolver
              products={parsedData}
              onResolveConflict={resolveSKUConflict}
              onResolveAll={resolveAllConflicts}
              onContinue={() => setStep('preview')}
            />
          )}

          {step === 'preview' && (
            <div className="space-y-3 md:space-y-4 h-full flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex gap-2">
                  <Badge variant="default" className="text-xs">{validCount} Valid</Badge>
                  {errorCount > 0 && <Badge variant="destructive" className="text-xs">{errorCount} Error</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep('upload')} className="text-xs">
                  <X className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                  <span className="hidden sm:inline">Pilih File Lain</span>
                  <span className="sm:hidden">File Lain</span>
                </Button>
              </div>

              <ScrollArea className="flex-1 border rounded-lg max-h-96">
                <div className="p-3 md:p-4 space-y-2">
                  {parsedData.map((product, index) => (
                    <div key={index} className={`border rounded-lg p-2.5 md:p-3 ${product.validation.valid ? 'border-green-600' : 'border-red-600'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            {product.validation.valid ? (
                              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 md:w-4 md:h-4 text-red-600 flex-shrink-0" />
                            )}
                            <span className="font-medium text-xs md:text-sm">Baris {product.rowIndex}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2 text-xs">
                            <div className="truncate"><strong>Nama:</strong> {product.name || '-'}</div>
                            <div className="truncate"><strong>SKU:</strong> {product.sku || '-'}</div>
                            <div className="truncate"><strong>Kategori:</strong> {product.category || '-'}</div>
                            <div className="truncate"><strong>Harga:</strong> {product.price ? `Rp ${product.price.toLocaleString('id-ID')}` : 'Tidak diset'}</div>
                            <div className="truncate"><strong>Stok:</strong> {product.stock}</div>
                            <div className="truncate"><strong>Status:</strong> {product.status}</div>
                          </div>

                          {(product.validation.errors.length > 0 || product.validation.warnings.length > 0) && (
                            <div className="mt-2 space-y-0.5 md:space-y-1">
                              {product.validation.errors.map((error, i) => (
                                <p key={i} className="text-red-600 text-xs">❌ {error}</p>
                              ))}
                              {product.validation.warnings.map((warning, i) => (
                                <p key={i} className="text-yellow-600 text-xs">⚠️ {warning}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-8 md:py-12 space-y-3 md:space-y-4">
              <Progress value={progress} className="w-48 md:w-64" />
              <p className="text-center text-sm md:text-base">Mengimpor produk ke database...</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-3 md:pt-4 pb-3 md:pb-4">
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-xs md:text-sm">
              Batal
            </Button>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto text-xs md:text-sm">
                Batal
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={validCount === 0}
                className="w-full sm:w-auto min-w-24 md:min-w-32 text-xs md:text-sm"
              >
                Import {validCount} Produk
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
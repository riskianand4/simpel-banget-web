import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, Edit3, Save, X, Package, MapPin, User, Calendar, TrendingUp, AlertTriangle, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

const editProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  price: z.number().min(0, 'Harga harus lebih besar dari 0'),
  stock: z.number().min(0, 'Stok tidak boleh negatif'),
  minStock: z.number().min(1, 'Minimum stok harus lebih besar dari 0'),
  description: z.string().default(''),
  location: z.string().default(''),
  supplier: z.string().default(''),
  
});
type EditProductFormData = z.infer<typeof editProductSchema>;
interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  description?: string;
  location?: string;
  supplier?: string;
  image?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}
interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (product: Product) => void;
}
const ProductDetailModal = ({
  product,
  isOpen,
  onClose,
  onUpdate,
}: ProductDetailModalProps) => {
  const { user } = useApp();
  const isAdmin = user?.role === 'superadmin';
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const form = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: product?.name || '',
      price: product?.price || 0,
      stock: product?.stock || 0,
      minStock: product?.minStock || 1,
      description: product?.description || '',
      location: product?.location || '',
      supplier: product?.supplier || '',
      
    }
  });

  // Update form when product changes
  React.useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
        stock: product.stock,
        minStock: product.minStock,
        description: product.description || '',
        location: product.location || '',
        supplier: product.supplier || '',
        
      });
    }
  }, [product, form]);
  const onSubmit = async (data: EditProductFormData) => {
    if (!product) return;
    try {
      const updatedProduct = {
        ...product,
        ...data,
        status: data.stock <= data.minStock ? 'low_stock' as const : data.stock === 0 ? 'out_of_stock' as const : 'in_stock' as const,
      };
      
      onUpdate(updatedProduct);
      setIsEditing(false);
      toast({
        title: 'Product Updated',
        description: `${data.name} has been updated successfully`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive'
      });
    }
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge className="bg-green-100 text-green-800">Tersedia</Badge>;
      case 'low_stock':
        return <Badge className="bg-yellow-100 text-yellow-800">Menipis</Badge>;
      case 'out_of_stock':
        return <Badge className="bg-red-100 text-red-800">Habis</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };
  if (!product) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{product.name}</h2>
                <p className="text-sm text-muted-foreground">{product.sku}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(product.status)}
              {!isEditing ? isAdmin && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </Button> : <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
                  <Eye className="w-4 h-4" />
                  View
                </Button>}
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Product Details</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Info</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {!isEditing ? (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Informasi Dasar
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nama Produk</label>
                      <p className="text-base font-medium bg-background rounded px-2 py-1 border">{product.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SKU</label>
                      <p className="text-base font-mono bg-background rounded px-2 py-1 border">{product.sku}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Kategori</label>
                      <p className="text-base bg-background rounded px-2 py-1 border">{product.category}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Harga</label>
                      <p className="text-lg font-bold text-primary bg-background rounded px-2 py-1 border">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-sm flex items-center justify-center">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    Informasi Tambahan
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Deskripsi</label>
                      <p className="text-base bg-background rounded px-3 py-2 border min-h-[2.5rem] flex items-start">{product.description || 'Tidak ada deskripsi'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lokasi</label>
                        <p className="text-base flex items-center gap-2 bg-background rounded px-2 py-1 border">
                          <MapPin className="w-4 h-4" />
                          {product.location || 'Lokasi tidak ditentukan'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Supplier</label>
                        <p className="text-base flex items-center gap-2 bg-background rounded px-2 py-1 border">
                          <User className="w-4 h-4" />
                          {product.supplier || 'Supplier tidak ditentukan'}
                        </p>
                      </div>
                    </div>
                    {(product.image || (product.images && product.images.length > 0)) && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gambar Produk</label>
                        <div className="mt-2">
                          <img 
                            src={product.image || (product.images && product.images[0]) || ''} 
                            alt={product.name} 
                            className="w-32 h-32 object-cover rounded-lg border" 
                            onError={e => {
                              e.currentTarget.src = '';
                              e.currentTarget.style.display = 'none';
                            }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Product Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="price" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Price (IDR)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="stock" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="minStock" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Minimum Stock</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="location" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Warehouse A-1-B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <FormField control={form.control} name="supplier" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., PT Teknologi Nusantara" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>

                  <FormField control={form.control} name="description" render={({
                field
              }) => <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Product description..." className="min-h-[80px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Product Image</label>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative w-32 h-32 mx-auto border-2 border-dashed border-border rounded-lg overflow-hidden">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 bg-background/80"
                          onClick={() => {
                            setImagePreview('');
                            setSelectedImageFile(null);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* File Upload */}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Validate file type
                            if (!file.type.startsWith('image/')) {
                              toast({
                                title: 'Error',
                                description: 'Hanya file gambar yang diizinkan',
                                variant: 'destructive'
                              });
                              return;
                            }
                            
                            // Validate file size (5MB)
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: 'Error',
                                description: 'Ukuran file maksimal 5MB',
                                variant: 'destructive'
                              });
                              return;
                            }

                            const url = URL.createObjectURL(file);
                            setImagePreview(url);
                            setSelectedImageFile(file);
                            
                            toast({
                              title: 'Success',
                              description: 'Gambar berhasil dipilih'
                            });
                          }
                        }}
                        className="hidden"
                        id="imageFileEdit"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('imageFileEdit')?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {imagePreview ? 'Ganti Gambar' : 'Pilih File Gambar'}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Upload file gambar produk (maksimal 5MB, format: JPG, PNG, GIF)
                    </p>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>}
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Stock</p>
                      <p className="text-2xl font-bold">{product.stock}</p>
                    </div>
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum Stock</p>
                      <p className="text-2xl font-bold">{product.minStock}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-warning" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Value</p>
                      <p className="text-lg font-bold">{formatCurrency(product.price * product.stock)}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-success" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Stock Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Created</p>
                      <p className="text-sm text-muted-foreground">{formatDate(product.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <Edit3 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Last Updated</p>
                      <p className="text-sm text-muted-foreground">{formatDate(product.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Stock Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Stock Level</span>
                      <span className={`font-medium ${product.stock > product.minStock ? 'text-success' : product.stock > 0 ? 'text-warning' : 'text-destructive'}`}>
                        {product.stock > product.minStock ? 'Healthy' : product.stock > 0 ? 'Low' : 'Critical'}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className={`h-2 rounded-full ${product.stock > product.minStock ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-destructive'}`} style={{
                      width: `${Math.min(product.stock / (product.minStock * 2) * 100, 100)}%`
                    }} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stock Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days of Supply</span>
                      <span className="font-medium">{Math.floor(product.stock / 2)} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reorder Point</span>
                      <span className="font-medium">{product.minStock}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stock Turnover</span>
                      <span className="font-medium">2.4x/month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
export default ProductDetailModal;
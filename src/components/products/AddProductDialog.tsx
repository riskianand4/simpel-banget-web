import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { useEnhancedProductManager } from '@/hooks/useEnhancedProductManager';
import { WAREHOUSE_LOCATIONS } from '@/data/constants';

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  sku: z.string().min(1, 'SKU wajib diisi'),
  productCode: z.string().min(1, 'Kode produk wajib diisi'),
  category: z.string().min(1, 'Kategori wajib dipilih'),
  price: z.number().min(0, 'Harga harus lebih besar dari 0'),
  stock: z.number().min(0, 'Stok tidak boleh negatif'),
  minStock: z.number().min(1, 'Minimum stok harus lebih besar dari 0'),
  description: z.string().default(''),
  location: z.string().min(1, 'Lokasi gudang wajib dipilih'),
  supplier: z.string().default(''),
});

type ProductFormData = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const categories = [
  'Network Equipment',
  'Cables & Connectors', 
  'Access Points',
  'Servers & Storage',
  'Security Equipment',
  'Power & UPS',
  'Tools & Accessories'
];

const AddProductDialog = ({ open, onOpenChange }: AddProductDialogProps) => {
  const { addProduct, isLoading } = useEnhancedProductManager();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      productCode: '',
      category: '',
      price: 0,
      stock: 0,
      minStock: 1,
      description: '',
      location: '',
      supplier: '',
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Hanya file gambar yang diizinkan');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }

      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setSelectedImageFile(file);
      
      toast.success('Gambar berhasil dipilih');
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Cast to ensure all required fields are present
      const productData = {
        name: data.name,
        sku: data.sku,
        productCode: data.productCode,
        category: data.category,
        price: data.price,
        stock: data.stock,
        minStock: data.minStock,
        description: data.description || '',
        location: data.location || '',
        supplier: data.supplier || '',
        image: '',
        images: [],
      };
      
      await addProduct(productData, selectedImageFile || undefined);
      form.reset();
      setImagePreview('');
      setSelectedImageFile(null);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto mobile-responsive-padding">
        <DialogHeader className="mobile-spacing-normal">
          <DialogTitle className="flex items-center mobile-gap-normal mobile-text-medium">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Tambah Produk Baru
          </DialogTitle>
          <DialogDescription className="mobile-text-small">
            Lengkapi informasi produk yang akan ditambahkan ke inventory
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {/* Product Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs sm:text-sm">Nama Produk *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Router Cisco RV340W" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SKU */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">SKU *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: RTR-CSC-RV340W" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Kode unik untuk identifikasi produk
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Product Code */}
              <FormField
                control={form.control}
                name="productCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Kode Produk *</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: RV340W-001" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Kode yang tertera pada produk fisik
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Kategori *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border border-border shadow-lg z-50">
                        {categories.map((category) => (
                          <SelectItem 
                            key={category} 
                            value={category}
                            className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          >
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Harga (IDR) *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Stock */}
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Stok Saat Ini *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Min Stock */}
              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Minimum Stok *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Alert akan muncul jika stok di bawah nilai ini
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Lokasi Gudang *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih lokasi gudang" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border border-border shadow-lg z-[100]">
                        {WAREHOUSE_LOCATIONS.map((location) => (
                          <SelectItem 
                            key={location} 
                            value={location}
                            className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                          >
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Supplier */}
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs sm:text-sm">Supplier</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: PT Teknologi Nusantara" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Product Image */}
            <div className="space-y-3">
              <Label className="text-xs sm:text-sm">Gambar Produk</Label>
              <div className="space-y-3">
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
                      <Label htmlFor="imageFile" className="text-sm">Upload Gambar</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="imageFile"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('imageFile')?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Pilih File Gambar
                        </Button>
                      </div>
                    </div>
                    
                    <FormDescription className="text-xs">
                      Upload file gambar produk (maksimal 5MB, format: JPG, PNG, GIF)
                    </FormDescription>
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs sm:text-sm">Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Deskripsi detail produk..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-3 sm:pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Plus className="w-4 h-4 mr-2" />
                {isLoading ? 'Menyimpan...' : 'Tambah Produk'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
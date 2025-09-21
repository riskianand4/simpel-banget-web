# Contoh Format Data Import Produk

## Format File yang Didukung
- **Excel**: .xlsx, .xls
- **CSV**: .csv

## Struktur Kolom (Header)

### Kolom Wajib (Required)
| Nama Kolom | Alternatif Nama | Tipe Data | Contoh | Keterangan |
|------------|-----------------|-----------|---------|-------------|
| Nama Produk | name, nama, nama produk, product name | Text | "Laptop Gaming ASUS ROG" | Nama lengkap produk |
| SKU | sku, kode, code, kode produk, product code | Text | "LPT-001" | Kode unik produk |
| Kategori | category, kategori, cat | Text | "Elektronik" | Kategori produk |
| Stok | stock, stok, qty, quantity, jumlah | Number | 10 | Jumlah stok tersedia |

### Kolom Opsional (Optional)
| Nama Kolom | Alternatif Nama | Tipe Data | Default | Contoh | Keterangan |
|------------|-----------------|-----------|---------|---------|-------------|
| Harga | price, harga, price_idr, harga_jual | Number | 0 | 15000000 | Harga jual dalam Rupiah |
| Stok Minimum | min_stock, stok_min, minimum_stock, min stock | Number | 5 | 2 | Batas minimum stok |
| Status | status, aktif, active | Text | "active" | "active" | active/inactive/discontinued |
| Lokasi | location, lokasi, gudang, warehouse | Text | "" | "Gudang A" | Lokasi penyimpanan |
| Supplier | supplier, pemasok, vendor | Text | "" | "PT Tech Supplier" | Nama supplier |
| Satuan | unit, satuan, uom | Text | "pcs" | "unit" | Satuan produk |
| Deskripsi | description, deskripsi, keterangan, desc | Text | "" | "Laptop gaming..." | Deskripsi produk |

## Contoh Data Excel/CSV

### Contoh 1: Format Lengkap
```csv
Nama Produk,SKU,Kategori,Harga,Stok,Stok Minimum,Status,Lokasi,Supplier,Satuan,Deskripsi
"Laptop Gaming ASUS ROG","LPT-001","Elektronik",15000000,10,2,"active","Gudang A","PT Tech Supplier","unit","Laptop gaming dengan spesifikasi tinggi untuk gaming dan produktivitas"
"Mouse Gaming Logitech","MSE-002","Aksesoris",850000,25,5,"active","Gudang A","PT Gaming Store","pcs","Mouse gaming dengan sensor presisi tinggi dan RGB lighting"
"Keyboard Mechanical","KBD-003","Aksesoris",1250000,15,3,"active","Gudang B","PT Peripheral Corp","pcs","Keyboard mechanical dengan switch blue dan backlight"
"Monitor 4K LG","MON-004","Elektronik",4500000,8,2,"active","Gudang A","PT Display Tech","unit","Monitor 4K 27 inch dengan teknologi IPS dan HDR support"
```

### Contoh 2: Format Minimal (Hanya Kolom Wajib)
```csv
Nama Produk,SKU,Kategori,Stok
"Laptop Gaming ASUS ROG","LPT-001","Elektronik",10
"Mouse Gaming Logitech","MSE-002","Aksesoris",25
"Keyboard Mechanical","KBD-003","Aksesoris",15
"Monitor 4K LG","MON-004","Elektronik",8
```

### Contoh 3: Format dengan Nama Kolom Indonesia
```csv
Nama,Kode,Kategori,Harga,Jumlah,Stok Min,Lokasi,Pemasok
"Laptop Gaming ASUS ROG","LPT-001","Elektronik",15000000,10,2,"Gudang A","PT Tech Supplier"
"Mouse Gaming Logitech","MSE-002","Aksesoris",850000,25,5,"Gudang A","PT Gaming Store"
"Keyboard Mechanical","KBD-003","Aksesoris",1250000,15,3,"Gudang B","PT Peripheral Corp"
"Monitor 4K LG","MON-004","Elektronik",4500000,8,2,"Gudang A","PT Display Tech"
```

## Validasi Data

### Aturan Validasi:
1. **Nama Produk**: Tidak boleh kosong
2. **SKU**: Tidak boleh kosong dan harus unik
3. **Kategori**: Tidak boleh kosong
4. **Stok**: Harus berupa angka positif atau 0
5. **Harga**: Jika diisi, harus berupa angka positif
6. **Status**: Hanya menerima nilai "active", "inactive", atau "discontinued"
7. **Stok Minimum**: Jika diisi, harus berupa angka positif

### Penanganan Data Kosong:
- **Harga**: Jika kosong, akan diset ke 0
- **Stok Minimum**: Jika kosong, akan diset ke 5
- **Status**: Jika kosong atau tidak valid, akan diset ke "active"
- **Satuan**: Jika kosong, akan diset ke "pcs"
- **Lokasi, Supplier, Deskripsi**: Jika kosong, akan diset ke string kosong

## Tips Import:
1. **Pastikan kolom header** sesuai dengan nama yang didukung
2. **Hindari SKU duplikat** dalam satu file
3. **Gunakan format angka** yang benar (tanpa titik atau koma untuk ribuan)
4. **Periksa preview data** sebelum mengimpor
5. **Download template** jika tidak yakin dengan format

## Cara Import:
1. Klik tombol "Import" di halaman produk
2. Pilih file Excel atau CSV
3. Sistem akan memproses dan menampilkan preview
4. Periksa data dan pesan error/warning
5. Klik "Import X Produk" untuk menyimpan data valid
6. Data yang error akan diabaikan dan tidak disimpan

## Troubleshooting:
- **Error "Nama produk wajib diisi"**: Pastikan kolom nama produk tidak kosong
- **Error "SKU wajib diisi"**: Pastikan kolom SKU tidak kosong
- **Error "Format file tidak didukung"**: Gunakan file Excel (.xlsx, .xls) atau CSV
- **Error "File kosong"**: Pastikan file berisi data dan header yang benar
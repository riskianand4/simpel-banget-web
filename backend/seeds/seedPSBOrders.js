const PSBOrder = require('../models/PSBOrder');

const seedPSBOrders = async (users) => {
  console.log('Seeding PSB orders...');

  const adminUser = users.find(u => u.role === 'admin');
  const staffUser = users.find(u => u.role === 'user');
  
  if (!adminUser || !staffUser) {
    console.log('Required users not found, skipping PSB seeding');
    return [];
  }

  // Generate realistic PSB data for the last 6 months
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
  
  const clusters = ['Jakarta Pusat', 'Jakarta Utara', 'Jakarta Selatan', 'Jakarta Timur', 'Jakarta Barat', 'Tangerang', 'Bekasi', 'Depok', 'Bogor'];
  const stos = ['STO JKT01', 'STO JKT02', 'STO JKT03', 'STO TNG01', 'STO BKS01', 'STO DPK01', 'STO BGR01'];
  const packages = ['IndyHome 20 Mbps', 'IndyHome 30 Mbps', 'IndyHome 50 Mbps', 'IndyHome 100 Mbps', 'UseeTV + Internet'];
  const technicians = ['Ahmad Setiawan', 'Budi Santoso', 'Candra Wijaya', 'Dedi Kurniawan', 'Eko Prasetyo'];
  const statuses = ['Completed', 'Completed', 'Completed', 'Pending', 'In Progress', 'Cancelled']; // More completed for realistic data

  const orders = [];
  let orderCounter = 1;

  // Generate 150 orders across 6 months
  for (let i = 0; i < 150; i++) {
    // Random date within the last 6 months
    const orderDate = new Date(
      sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
    );

    const cluster = clusters[Math.floor(Math.random() * clusters.length)];
    const sto = stos[Math.floor(Math.random() * stos.length)];
    const packageType = packages[Math.floor(Math.random() * packages.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const technician = technicians[Math.floor(Math.random() * technicians.length)];
    
    // Generate realistic customer data
    const customerNames = [
      'PT. Maju Bersama', 'CV. Sukses Mandiri', 'Toko Elektronik Jaya', 'Rumah Sakit Sehat',
      'Hotel Grand Indonesia', 'Restoran Padang Sederhana', 'Kantor Akuntan Publik',
      'Bengkel Motor Cepat', 'Salon Kecantikan Modern', 'Apotek Kimia Farma',
      'Warnet Game Zone', 'Laundry Express', 'Fotokopi 24 Jam', 'Toko Bangunan'
    ];
    
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const phoneNumber = ` +62${Math.floor(Math.random() * 900000000) + 100000000}`;
    
    // Generate addresses based on cluster
    const addresses = [
      `Jl. Sudirman No. ${Math.floor(Math.random() * 200) + 1}, ${cluster}`,
      `Jl. Gatot Subroto No. ${Math.floor(Math.random() * 150) + 1}, ${cluster}`,
      `Jl. Thamrin No. ${Math.floor(Math.random() * 100) + 1}, ${cluster}`,
      `Jl. Kuningan No. ${Math.floor(Math.random() * 75) + 1}, ${cluster}`,
      `Jl. Kemang No. ${Math.floor(Math.random() * 120) + 1}, ${cluster}`
    ];
    
    const address = addresses[Math.floor(Math.random() * addresses.length)];
    
    orders.push({
      no: orderCounter++,
      date: orderDate,
      cluster,
      sto,
      orderNo: `PSB${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(orderCounter).padStart(4, '0')}`,
      customerName,
      customerPhone: phoneNumber,
      address,
      package: packageType,
      status,
      technician: status === 'Completed' || status === 'In Progress' ? technician : undefined,
      notes: status === 'Cancelled' ? 'Pelanggan membatalkan pesanan' : 
             status === 'Completed' ? 'Instalasi berhasil dilakukan' :
             status === 'In Progress' ? 'Teknisi sedang dalam perjalanan' : '',
      createdBy: Math.random() > 0.5 ? adminUser._id : staffUser._id,
      updatedBy: status !== 'Pending' ? (Math.random() > 0.5 ? adminUser._id : staffUser._id) : undefined,
      createdAt: orderDate,
      updatedAt: status !== 'Pending' ? new Date(orderDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : orderDate
    });
  }

  const createdOrders = await PSBOrder.insertMany(orders);
  console.log(`Created ${createdOrders.length} PSB orders`);
  
  // Log some statistics
  const statusCounts = {};
  createdOrders.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });
  
  console.log('PSB Order Statistics:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count} orders`);
  });
  
  return createdOrders;
};

module.exports = { seedPSBOrders };
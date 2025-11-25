// ============================================
// IMPORT LIBRARY
// ============================================
const express = require('express');
const cors = require('cors');
const RouterOSAPI = require('routeros').RouterOSAPI;

// ============================================
// SETUP EXPRESS APP
// ============================================
const app = express();
const PORT = process.env.PORT || 3000; // Render.com akan set PORT otomatis

// Middleware untuk izinkan CORS (akses dari domain lain)
app.use(cors());
// Middleware untuk parsing JSON dari request body
app.use(express.json());

// ============================================
// ROUTE 1: HEALTH CHECK (GET /)
// ============================================
// Ini kayak "pintu depan" - untuk cek apakah server nyala
// Akses: https://vps-v5g1.onrender.com/
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'MikroTik API Proxy',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// ROUTE 2: MIKROTIK API (POST /api/mikrotik)
// ============================================
// Ini route utama untuk konek ke MikroTik
// Akses: https://vps-v5g1.onrender.com/api/mikrotik
app.post('/api/mikrotik', async (req, res) => {
  
  // 1. Ambil data dari request body
  const { host, username, password, port, command } = req.body;
  
  // 2. Validasi: pastikan data wajib ada
  if (!host || !username || !password) {
    return res.status(400).json({ 
      error: 'Host, username, dan password wajib diisi' 
    });
  }

  // 3. Setup koneksi ke MikroTik
  const conn = new RouterOSAPI({
    host: host,           // IP atau domain (idn5.tunnel.id)
    user: username,       // Username admin
    password: password,   // Password
    port: parseInt(port) || 8728,  // Port (default 8728)
    timeout: 10           // Timeout 10 detik
  });

  try {
    // 4. Log info ke console
    console.log(`[INFO] Connecting to ${host}:${port || 8728}...`);
    
    // 5. Connect ke MikroTik
    await conn.connect();
    
    // 6. Jalankan command MikroTik
    // Default: /system/resource/print (ambil info system)
    const result = await conn.write(command || '/system/resource/print');
    
    // 7. Tutup koneksi
    await conn.close();
    
    // 8. Log success
    console.log('[SUCCESS] Data retrieved successfully');
    
    // 9. Kirim response JSON ke client
    if (result && result.length > 0) {
      res.json({ 
        success: true, 
        data: result[0]  // Data pertama dari array
      });
    } else {
      res.json({ 
        success: true, 
        data: result 
      });
    }
    
  } catch (error) {
    // 10. Kalau ada error, log dan kirim error response
    console.error('[ERROR]', error.message);
    
    // Pastikan koneksi tertutup
    try {
      await conn.close();
    } catch (e) {
      // Ignore error saat close
    }
    
    // Kirim error response
    res.status(500).json({ 
      error: error.message || 'Gagal terhubung ke MikroTik',
      details: 'Pastikan IP, username, password benar dan API service aktif di MikroTik'
    });
  }
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Endpoint: /api/mikrotik`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

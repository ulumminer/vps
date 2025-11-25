const express = require('express');
const cors = require('cors');
const RouterOSClient = require('routeros-client').RouterOSClient;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'MikroTik API Proxy',
    timestamp: new Date().toISOString()
  });
});

// MikroTik API endpoint
app.post('/api/mikrotik', async (req, res) => {
  const { host, username, password, port, command } = req.body;
  
  if (!host || !username || !password) {
    return res.status(400).json({ 
      error: 'Host, username, dan password wajib diisi' 
    });
  }

  const client = new RouterOSClient({
    host: host,
    user: username,
    password: password,
    port: parseInt(port) || 8728,
    timeout: 10000
  });

  try {
    console.log(`[INFO] Connecting to ${host}:${port || 8728}...`);
    
    await client.connect();
    
    const result = await client.menu(command || '/system/resource').getAll();
    
    await client.close();
    
    console.log('[SUCCESS] Data retrieved successfully');
    
    if (result && result.length > 0) {
      res.json({ 
        success: true, 
        data: result[0] 
      });
    } else {
      res.json({ 
        success: true, 
        data: result 
      });
    }
    
  } catch (error) {
    console.error('[ERROR]', error.message);
    
    // Close connection if still open
    try {
      await client.close();
    } catch (e) {}
    
    res.status(500).json({ 
      error: error.message || 'Gagal terhubung ke MikroTik',
      details: 'Pastikan IP, username, password benar dan API service aktif di MikroTik'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Endpoint: /api/mikrotik`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

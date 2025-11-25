const express = require('express');
const cors = require('cors');
const RouterOSAPI = require('node-routeros').RouterOSAPI;

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

  const api = new RouterOSAPI({
    host: host,
    user: username,
    password: password,
    port: parseInt(port) || 8728,
    timeout: 10
  });

  try {
    console.log(`[INFO] Connecting to ${host}:${port}...`);
    await api.connect();
    
    const result = await api.write(command || '/system/resource/print');
    
    await api.disconnect();
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
    res.status(500).json({ 
      error: error.message || 'Gagal terhubung ke MikroTik' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Endpoint: /api/mikrotik`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

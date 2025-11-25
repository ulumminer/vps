// cron-auto-disable.js
// Script untuk Render.com Cron Job - Auto disable PPP Secret setiap tanggal 11

const fetch = require('node-fetch');
const cheerio = require('cheerio');

// ========== KONFIGURASI ==========
const CONFIG = {
  // MikroTik (dari environment variables)
  MIKROTIK_HOST: process.env.MIKROTIK_HOST || 'idn5.tunnel.id',
  MIKROTIK_PORT: process.env.MIKROTIK_PORT || '140',
  MIKROTIK_USER: process.env.MIKROTIK_USER || 'admin',
  MIKROTIK_PASS: process.env.MIKROTIK_PASS,
  
  // Invoice
  INVOICE_URL: 'https://khatulistiwanet.page.gd/invoices.php',
  
  // API Endpoint (pakai server Express.js Anda sendiri)
  API_ENDPOINT: process.env.API_ENDPOINT || 'http://localhost:3000/api/mikrotik'
};

// Validasi config
if (!CONFIG.MIKROTIK_PASS) {
  console.error('❌ ERROR: MIKROTIK_PASS environment variable is not set!');
  process.exit(1);
}

// ========== FUNGSI UTAMA ==========
async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  🚀 KHATULISTIWANET AUTO-DISABLE PPP SECRET  ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('⏰ Execution Time:', new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }));
  console.log('');
  
  try {
    // Step 1: Fetch invoice data
    console.log('📄 [STEP 1] Fetching invoice data from:', CONFIG.INVOICE_URL);
    const pelangganList = await fetchInvoiceData();
    
    if (pelangganList.length === 0) {
      console.log('⚠️  WARNING: No customers found in invoice page!');
      console.log('💡 TIP: Check if invoices.php is accessible and contains data');
      return;
    }
    
    console.log(`✅ Found ${pelangganList.length} customer(s) in invoice:`);
    pelangganList.forEach((nama, idx) => {
      console.log(`   ${idx + 1}. ${nama}`);
    });
    console.log('');
    
    // Step 2: Disable each customer in MikroTik
    console.log('🔧 [STEP 2] Processing PPP Secrets in MikroTik...');
    console.log('─'.repeat(60));
    const results = await disableAllCustomers(pelangganList);
    
    // Step 3: Display results
    console.log('');
    console.log('─'.repeat(60));
    console.log('📊 [STEP 3] EXECUTION SUMMARY');
    console.log('─'.repeat(60));
    
    const success = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'error');
    const notFound = results.filter(r => r.status === 'not_found');
    
    if (success.length > 0) {
      console.log('\n✅ Successfully Disabled:');
      success.forEach(r => console.log(`   • ${r.nama} (ID: ${r.secretId})`));
    }
    
    if (notFound.length > 0) {
      console.log('\n⚠️  Not Found in MikroTik:');
      notFound.forEach(r => console.log(`   • ${r.nama}`));
    }
    
    if (failed.length > 0) {
      console.log('\n❌ Failed to Process:');
      failed.forEach(r => console.log(`   • ${r.nama}: ${r.message}`));
    }
    
    console.log('\n' + '─'.repeat(60));
    console.log(`📦 Total Processed: ${results.length}`);
    console.log(`   ✅ Success: ${success.length}`);
    console.log(`   ⚠️  Not Found: ${notFound.length}`);
    console.log(`   ❌ Failed: ${failed.length}`);
    console.log('─'.repeat(60));
    
    console.log('\n✅ AUTO-DISABLE PROCESS COMPLETED!');
    
  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// ========== FUNGSI AMBIL DATA INVOICE ==========
async function fetchInvoiceData() {
  try {
    const response = await fetch(CONFIG.INVOICE_URL, {
      headers: {
        'User-Agent': 'KhatulistiwaNet-AutoDisable/1.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const pelangganList = [];
    
    // Parse tabel HTML
    // Format: <tr><td>1</td><td>anjani</td><td>...</td></tr>
    $('table tbody tr, table tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length >= 2) {
        const nama = $(cells[1]).text().trim(); // Kolom ke-2 adalah "Pelanggan"
        
        // Filter: skip header dan empty
        if (nama && 
            nama !== 'Pelanggan' && 
            nama !== '' && 
            !nama.includes('No data')) {
          pelangganList.push(nama);
        }
      }
    });
    
    // Deduplicate
    return [...new Set(pelangganList)];
    
  } catch (error) {
    console.error('❌ Error fetching invoice:', error.message);
    throw error;
  }
}

// ========== FUNGSI DISABLE SEMUA PELANGGAN ==========
async function disableAllCustomers(pelangganList) {
  const results = [];
  
  for (let i = 0; i < pelangganList.length; i++) {
    const nama = pelangganList[i];
    const progress = `[${i + 1}/${pelangganList.length}]`;
    
    console.log(`\n${progress} Processing: "${nama}"`);
    
    try {
      // 1. Cari PPP Secret by name
      console.log(`   → Searching in MikroTik...`);
      const findResult = await callMikrotikAPI('/ppp/secret/print', `?name=${nama}`);
      
      if (findResult.error) {
        throw new Error(findResult.error);
      }
      
      if (!findResult.data || findResult.data.length === 0) {
        console.log(`   ⚠️  PPP Secret not found in MikroTik`);
        results.push({
          nama: nama,
          status: 'not_found',
          message: 'PPP Secret not found'
        });
        continue;
      }
      
      const secret = findResult.data[0];
      const secretId = secret['.id'];
      const currentStatus = secret.disabled === 'true' ? 'disabled' : 'enabled';
      
      console.log(`   ✓ Found: ID="${secretId}", Status="${currentStatus}"`);
      
      // Jika sudah disabled, skip
      if (currentStatus === 'disabled') {
        console.log(`   ℹ️  Already disabled, skipping...`);
        results.push({
          nama: nama,
          status: 'success',
          message: 'Already disabled',
          secretId: secretId,
          skipped: true
        });
        continue;
      }
      
      // 2. Disable PPP Secret
      console.log(`   → Disabling...`);
      const disableResult = await callMikrotikAPI('/ppp/secret/set', null, {
        '.id': secretId,
        'disabled': 'yes'
      });
      
      if (disableResult.error) {
        throw new Error(disableResult.error);
      }
      
      console.log(`   ✅ Successfully disabled!`);
      results.push({
        nama: nama,
        status: 'success',
        message: 'Disabled successfully',
        secretId: secretId
      });
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      results.push({
        nama: nama,
        status: 'error',
        message: error.message
      });
    }
    
    // Delay untuk menghindari overload
    if (i < pelangganList.length - 1) {
      await sleep(500);
    }
  }
  
  return results;
}

// ========== FUNGSI PANGGIL MIKROTIK API ==========
async function callMikrotikAPI(command, query = null, params = null) {
  try {
    const payload = {
      host: CONFIG.MIKROTIK_HOST,
      port: CONFIG.MIKROTIK_PORT,
      username: CONFIG.MIKROTIK_USER,
      password: CONFIG.MIKROTIK_PASS,
      command: command
    };
    
    if (query) {
      payload.query = query;
    }
    
    if (params) {
      payload.params = params;
    }
    
    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'KhatulistiwaNet-AutoDisable/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 30000 // 30 detik timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    return result;
    
  } catch (error) {
    return { error: error.message };
  }
}

// ========== HELPER FUNCTIONS ==========
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ========== JALANKAN SCRIPT ==========
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🎉 Process completed successfully!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Process failed:', error.message, '\n');
      process.exit(1);
    });
}

module.exports = { main, fetchInvoiceData, disableAllCustomers };

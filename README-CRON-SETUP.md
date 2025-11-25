# 🕐 Setup Auto-Disable Cron Job di Render.com

## 📋 Penjelasan Sistem

Sistem ini akan **otomatis mematikan PPP Secret pelanggan** setiap tanggal 11 jam 02:00 WIB dengan cara:

1. Membaca daftar pelanggan dari `https://khatulistiwanet.page.gd/invoices.php`
2. Mencari PPP Secret di MikroTik berdasarkan nama pelanggan
3. Disable PPP Secret jika ditemukan
4. Menampilkan log hasil di Render.com Dashboard

---

## 🚀 Langkah Setup

### 1. **Upload File ke GitHub**

Tambahkan file-file ini ke repo GitHub Anda (`https://github.com/ulumminer/vps`):

```
vps/
├── index.js                    # Server Express.js (sudah ada)
├── cron-auto-disable.js        # ← Script cron baru
├── package.json                # ← Update dependencies
└── README-CRON-SETUP.md        # ← Dokumentasi ini
```

**Cara upload:**
```bash
cd /path/to/vps
git add cron-auto-disable.js package.json README-CRON-SETUP.md
git commit -m "Add auto-disable cron job"
git push origin main
```

---

### 2. **Buat Cron Job di Render.com**

#### A. Login ke Render.com
- Buka https://render.com
- Login dengan akun Anda

#### B. Create New Cron Job
1. Klik **New +** di dashboard
2. Pilih **Cron Job**
3. Klik **Connect** repository GitHub `ulumminer/vps`

#### C. Konfigurasi Cron Job
Isi form dengan data berikut:

| Field | Value |
|-------|-------|
| **Name** | `khatulistiwanet-auto-disable` |
| **Region** | Singapore (Southeast Asia) |
| **Branch** | `main` |
| **Command** | `npm run cron` |
| **Schedule** | `0 19 10 * *` |

**Penjelasan Schedule:**
- Format: `menit jam tanggal bulan hari-dalam-minggu`
- `0 19 10 * *` = Jam 19:00 UTC tanggal 10 = **02:00 WIB tanggal 11**
- (UTC+7 = WIB, jadi 19:00 UTC kemarin = 02:00 WIB hari ini)

#### D. Set Environment Variables
Klik **Add Environment Variable** dan tambahkan:

| Key | Value | Note |
|-----|-------|------|
| `MIKROTIK_HOST` | `idn5.tunnel.id` | Atau IP MikroTik Anda |
| `MIKROTIK_PORT` | `140` | Port API MikroTik |
| `MIKROTIK_USER` | `admin` | Username MikroTik |
| `MIKROTIK_PASS` | `password_anda` | ⚠️ **RAHASIA!** |
| `API_ENDPOINT` | `https://vps-md80.onrender.com/api/mikrotik` | URL Web Service Anda |

⚠️ **PENTING:** Jangan share environment variables ini!

#### E. Create Cron Job
- Klik **Create Cron Job**
- Tunggu deploy selesai (~2-3 menit)

---

### 3. **Testing Manual**

Setelah deploy selesai:

1. Buka Cron Job di Render Dashboard
2. Klik tab **Manual Jobs**
3. Klik **Trigger Run**
4. Lihat **Logs** untuk hasil eksekusi

**Expected Output:**
```
╔════════════════════════════════════════════════╗
║  🚀 KHATULISTIWANET AUTO-DISABLE PPP SECRET  ║
╚════════════════════════════════════════════════╝
⏰ Execution Time: 11/25/2025, 2:00:00 AM

📄 [STEP 1] Fetching invoice data...
✅ Found 1 customer(s) in invoice:
   1. anjani

🔧 [STEP 2] Processing PPP Secrets in MikroTik...
────────────────────────────────────────────────────────────
[1/1] Processing: "anjani"
   → Searching in MikroTik...
   ✓ Found: ID="*123", Status="enabled"
   → Disabling...
   ✅ Successfully disabled!

📊 [STEP 3] EXECUTION SUMMARY
────────────────────────────────────────────────────────────
✅ Successfully Disabled:
   • anjani (ID: *123)

📦 Total Processed: 1
   ✅ Success: 1
   ⚠️  Not Found: 0
   ❌ Failed: 0

🎉 Process completed successfully!
```

---

## 🔍 Monitoring & Troubleshooting

### Cek Log Eksekusi
1. Buka Render Dashboard
2. Pilih Cron Job Anda
3. Klik tab **Logs**
4. Lihat history eksekusi terakhir

### Cek Schedule Berikutnya
Di Render Dashboard → Cron Job → Lihat **Next Run** di header

### Error: "No customers found"
**Penyebab:** 
- Invoice page kosong atau tidak bisa diakses
- Format HTML berubah

**Solusi:**
- Cek apakah `invoices.php` bisa dibuka di browser
- Pastikan ada data pelanggan di tabel

### Error: "MIKROTIK_PASS not set"
**Penyebab:** Environment variable tidak diset

**Solusi:**
1. Buka Settings → Environment Variables
2. Tambahkan `MIKROTIK_PASS` dengan password MikroTik

### Error: "PPP Secret not found"
**Penyebab:** Nama di invoice tidak sama dengan nama di MikroTik

**Solusi:**
- Pastikan nama pelanggan di invoice **PERSIS SAMA** dengan nama di `/ppp/secret`
- Case-sensitive! `Anjani` ≠ `anjani`

---

## 📝 Modifikasi Schedule

Mau ubah jadwal? Edit di Render Dashboard:
1. Cron Job → Settings → Schedule
2. Update cron expression

**Contoh Schedule Lain:**
- `0 20 10 * *` = Jam 03:00 WIB tanggal 11
- `0 0 11 * *` = Jam 07:00 WIB tanggal 11
- `0 2 * * *` = Setiap hari jam 09:00 WIB

**Cron Expression Generator:** https://crontab.guru/

---

## 🔐 Security Notes

1. **Jangan commit** `MIKROTIK_PASS` ke GitHub
2. Gunakan **Environment Variables** di Render
3. Aktifkan **2FA** di akun Render.com
4. Limit akses ke MikroTik API (whitelist IP Render jika perlu)

---

## 📞 Support

Ada masalah? Cek:
1. Logs di Render Dashboard
2. Status Web Service (`vps-md80.onrender.com`)
3. Koneksi MikroTik (ping/test manual)

---

**Made with ❤️ for KHATULISTIWANET**

# 🚀 Portfolio Website (Modified & Extended Version)

Website portofolio profesional dan modern yang dilengkapi dengan **Content Management System (CMS) Admin Dashboard**, integrasi **Google Firebase (Firestore & Authentication)**, sistem blog interaktif dengan komentar real-time, serta kustomisasi tema warna dinamis.

---

## 📌 Keterangan Proyek & Lisensi Asli (Disclaimer)

> [!IMPORTANT]
> Proyek ini merupakan **versi modifikasi dan pengembangan lanjutan** (*customized & extended version*).
> 
> - **Desain Asli**: Dirancang oleh [Jayesh Patil](https://www.figma.com/@jayeshpatil) di Figma.
> - **Template Awal**: Berdasarkan repositori dasar oleh [MaheshPokale99](https://github.com/MaheshPokale99/my-project).
> - **Lisensi & Hak Cipta**: Seluruh lisensi dan hak cipta original tetap tercantum dan **dipertahankan 100% pada bagian Footer Website**.
> - **Fitur Tambahan pada Versi Modifikasi Ini**:
>   - Panel Admin (`/admin`) berbasis Firebase Authentication untuk mengubah seluruh teks, gambar, dan navigasi website secara visual.
>   - Realtime Database dengan Google Cloud Firestore (termasuk penyimpanan komentar blog dan statistik kunjungan).
>   - Fitur upload foto langsung dengan kompresi otomatis (Base64) serta dukungan preview tautan Google Drive.
>   - Fitur penggantian palet tema warna (CSS Variables) secara dinamis langsung dari Dashboard Admin.
>   - Tombol *One-Click* "Bersihkan Data Contoh" untuk memudahkan transisi dari template bawaan ke data asli.
>   - Static Export (`output: "export"`) teroptimasi untuk hosting statis gratis (Firebase Hosting, Vercel, Netlify, atau GitHub Pages).

---

## 🛠️ Framework & Teknologi yang Digunakan

Proyek ini dibangun menggunakan teknologi web modern:

| Teknologi | Versi | Peran & Penggunaan |
| :--- | :--- | :--- |
| **[Next.js](https://nextjs.org/)** | `15.3.3` | Framework React modern dengan App Router, Static Export (`output: "export"`), dan performa Turbopack. |
| **[React](https://react.dev/)** | `^19.0.0` | Library antarmuka pengguna berbasis komponen. |
| **[TypeScript](https://www.typescriptlang.org/)** | `^5.0.0` | Menjamin *type safety* dan kemudahan *maintenance* kode program. |
| **[Tailwind CSS](https://tailwindcss.com/)** | `^4.0.0` | Framework CSS utilitas generasi terbaru (`@tailwindcss/postcss`) dengan CSS variables kustom. |
| **[Firebase SDK](https://firebase.google.com/)** | `^12.17.1` | Layanan backend-as-a-service: **Firebase Auth** (login admin) dan **Cloud Firestore** (database realtime). |
| **[Swiper](https://swiperjs.com/)** | `^11.2.8` | Komponen slider interaktif dan responsif untuk Services, Portfolio, dan Testimonial. |
| **[Lucide React](https://lucide.dev/)** | `^0.517.0` | Ikon SVG modern, bersih, dan konsisten di seluruh halaman web. |
| **[Vercel Analytics](https://vercel.com/analytics)** | `^1.5.0` | Pelacak analitik performa web. |

---

## ✨ Fitur-Fitur Utama

1. **Antarmuka Portofolio Interaktif**:
   - **Hero Section**: Foto profil, kutipan, ringkasan pengalaman, rating bintang, dan tombol unduh/buka CV (Google Drive).
   - **Services Section**: Kartu layanan interaktif dengan modal penjelasan lengkap.
   - **Work Experience Section**: Riwayat karier dan pengalaman kerja terstruktur.
   - **Portfolio Showcase**: Galeri proyek lengkap dengan filter kategori, modal detail, dan tautan live demo/repo.
   - **Client Reviews**: Slider testimoni dari klien.
   - **Blog & Detail Post**: Artikel blog dinamis (`/blog/[id]`) dengan fitur komentar pengunjung dan hitungan suka (*likes*) yang tersimpan di Firestore.
   - **Contact & Social Links**: Akses cepat ke email, WhatsApp, LinkedIn, GitHub, Instagram, dan media sosial lainnya.
2. **Dashboard Admin Mandiri (`/admin`)**:
   - Login aman dengan Firebase Auth & fitur ganti password mandiri.
   - Pengeditan live untuk seluruh komponen halaman tanpa perlu menyentuh kode sumber.
   - Live Visitor Counter & estimasi kuota bandwidth (Upload/Download).
   - Pemilih tema warna instan menggunakan kode Hex.
   - Kompresi gambar otomatis saat upload atau integrasi tautan foto Google Drive.
3. **Optimasi & Keamanan**:
   - Next.js Static Export untuk kecepatan akses maksimal.
   - Aturan keamanan Firestore (`firestore.rules`) yang ketat (konten publik *read-only*, aksi tulis hanya oleh admin terotentikasi, validasi schema komentar).

---

## 📁 Struktur Folder Proyek

```text
├── .firebase/             # File cache CLI Firebase (diabaikan git)
├── .firebaserc            # Konfigurasi ID project Firebase
├── firebase.json          # Konfigurasi Firebase Hosting & Firestore Rules
├── firestore.rules        # Aturan keamanan database Cloud Firestore
├── next.config.ts         # Konfigurasi Next.js (Static Export, Unoptimized Images)
├── package.json           # Dependensi modul & scripts npm
├── postcss.config.mjs     # Konfigurasi PostCSS untuk Tailwind v4
├── public/                # File aset statis (logo, icon, gambar bawaan)
├── src/
│   ├── app/
│   │   ├── admin/         # Halaman Dashboard Admin & Login (/admin, /admin/login)
│   │   ├── blog/          # Halaman Blog & Detail Blog Dinamis (/blog/[id])
│   │   ├── globals.css    # Definisi styling Tailwind & variabel CSS warna
│   │   ├── layout.tsx     # Root Layout, Metadata, Provider, dan Footer
│   │   ├── page.tsx       # Landing page utama portofolio
│   │   └── Providers.tsx  # Wrapper Context React
│   ├── components/        # Komponen UI (Navbar, Footer)
│   │   └── ui/            # Komponen modular (Modal, Slider, Buttons, Cards, ScrollReveal)
│   ├── context/           # React Context (AdminContext untuk state global & Firestore)
│   ├── data/              # Data fallback awal jika database kosong
│   └── lib/
│       ├── firebase.ts    # Inisialisasi Firebase App, Auth, dan Firestore
│       └── utils.ts       # Fungsi pembantu (helper & converter link Drive)
└── tsconfig.json          # Konfigurasi compiler TypeScript
```

---

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah terpasang:
- **Node.js**: Versi `18.18.0` atau `20.x` ke atas (direkomendasikan versi LTS terbaru).
- **npm** (bawaan Node.js), **pnpm**, atau **yarn**.
- **Git** terpasang di komputer Anda.
- **Akun Google Firebase** (Gratis - Spark Plan).

---

## 🚀 Panduan Kloning & Menjalankan Proyek Secara Lokal

Ikuti langkah-langkah berikut untuk menjalankan website di komputer lokal:

### 1. Kloning Repositori

```bash
git clone https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git
cd NAMA_REPO_ANDA
```

### 2. Install Dependensi

Jalankan perintah berikut untuk mengunduh semua library yang diperlukan:

```bash
npm install
```

### 3. Konfigurasi Firebase SDK

Proyek ini memerlukan konfigurasi Firebase agar fitur Admin dan Blog Comments dapat berjalan.

1. Buat file `.env.local` di direktori utama dengan menyalin dari `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
2. Buka file `.env.local` lalu isi dengan kredensial Firebase Anda:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_FIREBASE_SDK_API_KEY"
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_SDK_AUTH_DOMAIN"
   NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_FIREBASE_SDK_PROJECT_ID"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_SDK_STORAGE_BUCKET"
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_SDK_MESSAGING_SENDER_ID"
   NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_FIREBASE_SDK_APP_ID"
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="YOUR_FIREBASE_SDK_MEASUREMENT_ID"
   ```
   *(Atau Anda dapat mengisinya langsung di file [`src/lib/firebase.ts`](src/lib/firebase.ts)).*

### 4. Jalankan Server Development

```bash
npm run dev
```

Buka peramban (browser) dan akses:
- **Website Utama**: [http://localhost:3000](http://localhost:3000)
- **Halaman Admin**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## ⚙️ Panduan Setup Firebase & Akun Admin Pertama

Jika Anda ingin menggunakan Firebase Anda sendiri dari awal:

1. **Buat Proyek di Firebase Console**:
   - Kunjungi [Firebase Console](https://console.firebase.google.com/) dan klik **Add project**.
   - Daftarkan Web App pada menu **Project Overview > Add app > Web (`</>`)**.
   - Salin konfigurasi `firebaseConfig` ke dalam file `.env.local` atau `src/lib/firebase.ts`.

2. **Aktifkan Firebase Authentication**:
   - Masuk ke menu **Build > Authentication > Sign-in method**.
   - Aktifkan provider **Email/Password**.
   - Buka tab **Users** lalu klik **Add user** untuk membuat akun Admin pertama Anda (masukkan email & password login admin).

3. **Aktifkan Cloud Firestore Database**:
   - Masuk ke menu **Build > Firestore Database > Create database**.
   - Pilih lokasi database terdekat (misal: `asia-southeast1` untuk Singapura / Jakarta).
   - Terapkan aturan keamanan yang terdapat pada file [`firestore.rules`](firestore.rules).

---

## 📦 Build & Deploy ke Firebase Hosting

Untuk membangun versi produksi dan mengunggahnya ke hosting:

1. **Build Static Export**:
   ```bash
   npm run build
   ```
   Hasil build berupa file HTML, CSS, dan JS statis akan tersimpan di dalam folder `out/`.

2. **Login ke Firebase CLI**:
   ```bash
   npx firebase login
   ```

3. **Hubungkan Project Firebase Anda**:
   ```bash
   npx firebase use --add
   ```
   *(Pilih ID Project Firebase Anda).*

4. **Deploy Firestore Rules & Hosting**:
   ```bash
   npx firebase deploy
   ```

---

## 🔐 Panduan Penggunaan Halaman Admin (`/admin`)

Setelah masuk ke Dashboard Admin, Anda dapat mengelola seluruh konten dengan mudah:

1. **Masuk ke Admin**: Kunjungi URL web Anda ditambah `/admin` lalu login dengan akun Firebase yang telah didaftarkan.
2. **Sidebar Menu**:
   - **Statistik Website**: Memantau jumlah kunjungan secara live serta estimasi kuota data.
   - **Header & Footer**: Mengatur nama menu navigasi, logo, tagline, alamat, email, dan link sosial media.
   - **Tema Warna**: Memilih warna aksen (*primary color*) dan palet tema dengan kode Hex.
   - **Hero & CV**: Mengatur salam, nama, jabatan, foto hero, rating, dan tautan file resume/CV di Google Drive.
   - **Layanan (Services)**: Menambah atau mengubah paket layanan beserta ikon/fotonya.
   - **Pengalaman Kerja (Work Experience)**: Menambah daftar riwayat pekerjaan.
   - **Portofolio (Projects)**: Menambah kartu karya/proyek beserta tag kategori dan link live demo.
   - **Blog Posts**: Menulis artikel, menentukan tanggal terbit, dan memasang cover gambar.
3. **Upload Foto**:
   - **Opsi A (Upload Langsung)**: Foto otomatis dikompresi menjadi Base64 berukuran kecil (~100 KB) agar hemat kuota dan cepat dimuat.
   - **Opsi B (Google Drive)**: Atur hak akses file di Drive menjadi *"Siapa saja yang memiliki link"*, lalu salin link-nya ke kolom foto di Admin.
4. **Tombol "Bersihkan Data Contoh"**:
   - Tombol di pojok kanan atas Admin berguna untuk mengosongkan seluruh konten *dummy* bawaan template saat pertama kali digunakan, tanpa menghapus atribusi hak cipta di footer.

---

## 📊 Batasan Layanan (Firebase Spark Plan - 100% Gratis)

Website ini dirancang sangat efisien untuk paket **Spark Plan (Gratis)** dari Google Firebase:
- **Kapasitas Kunjungan**: Mampu menampung sekitar **900 – 1.000 kunjungan per hari** (atau ~30.000 kunjungan per bulan) secara gratis.
- **Batas Kuota Bandwidth**: Firebase Spark menyediakan bandwidth unduh 360 MB/hari. Jika kuota harian habis, akses akan otomatis normal kembali keesokan harinya saat kuota di-reset.
- **Penyimpanan Gambar**: Karena gambar dikompresi atau ditarik langsung dari server Google Drive, kuota hosting tetap hemat dan ringan.

---

## 📄 Lisensi & Kredit

- **Desain Konsep**: [Jayesh Patil](https://www.figma.com/@jayeshpatil)
- **Kode Asli**: [MaheshPokale99/my-project](https://github.com/MaheshPokale99/my-project)
- **Modifikasi & Fitur Ekstensi**: Dikembangkan dengan penambahan CMS Admin, Cloud Firestore, Blog Realtime, dan Dynamic Color Theme.
- Hak Cipta desain asli tetap dilindungi sebagaimana tercantum pada footer aplikasi.

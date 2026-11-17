# Panduan Instalasi — English Journey (GitHub Pages + Google Apps Script)

## A. Backend (Google Apps Script) — sekali saja
1. Buka https://script.google.com → **Proyek baru**.
2. Ganti isi `Code.gs` dengan isi berkas **Kode.gs**, lalu rename file menjadi `Kode`.
3. Pilih fungsi **setupAppEnvironment** → ▶ Run → izinkan akses. **Jalankan hanya sekali.**
4. Buka **Execution Log**: catat kata sandi acak akun `admin` dan `guru1` (segera ganti lewat sheet Users bila perlu).
5. **Deploy → New deployment → Web app**: Execute as **Me**, Who has access **Anyone** → Deploy.
6. **Salin URL yang berakhiran `/exec`.**

## B. Frontend
1. Ekstrak `english-journey-frontend.zip`. Folder hasil ekstraksi bernama **`english-journey`**.
2. Buka `english-journey/js/config.js`, ganti `ISI_URL_EXEC_DI_SINI` dengan URL `/exec` dari langkah A6. Simpan.
3. Cek: di dalam folder `english-journey` harus langsung terlihat `index.html`, `css`, dan `js`.

## C. GitHub Pages
**Folder yang di-`git init` adalah `english-journey` itu sendiri** (bukan folder di atasnya).
1. Buat repository **Public** di github.com (jangan centang README/.gitignore/license).
2. Di terminal, masuk ke folder `english-journey`, lalu:
   ```
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/NAMA-REPO.git
   git push -u origin main
   ```
3. Saat diminta password, tempel **Personal Access Token** (scope `repo`).
4. Repo → **Settings → Pages** → Deploy from a branch → `main` / `(root)` → Save → centang **Enforce HTTPS**.
5. Buka `https://USERNAME.github.io/NAMA-REPO/` (tunggu 1-2 menit).

## D. Update
**Memperbarui dari versi sebelumnya (fitur admin & pengaturan):** ganti isi `Kode` dengan `Kode.gs` terbaru → Deploy → **Manage deployments** → ikon pensil → Version: **New version** → Deploy (URL `/exec` tidak berubah). Untuk frontend, ganti isi folder dengan ZIP terbaru (pertahankan `js/config.js` Anda), lalu `git add .` → `git commit` → `git push`. Jangan jalankan `setupAppEnvironment` lagi.

```
git add .
git commit -m "Deskripsi perubahan"
git push
```
Perubahan `Kode.gs`: Deploy → **Manage deployments** → edit → versi baru (URL `/exec` tetap).

## E. Tes
Daftar sebagai siswa → tes penempatan → selesaikan satu pelajaran → login `guru1` untuk melihat laporan.

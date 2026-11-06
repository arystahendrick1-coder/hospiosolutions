# Website Hospio Solutions

Website HTML biasa. Cloudflare menjalankan `node build.js` setiap ada perubahan di GitHub, lalu menayangkan folder `dist`.

## Cara menambah artikel blog
1. Salin `blog/_template-artikel.html`, ganti namanya (huruf kecil, tanda hubung), simpan di folder `blog/`.
2. Ikuti petunjuk di bagian atas file itu. Foto baru taruh di `images/`; foto yang sudah ada boleh dipakai ulang.
3. Commit di GitHub. Daftar di halaman Blog dan sitemap.xml terisi otomatis.

## Isi folder
- Halaman: index, services, about-us, contact, blog, privacy-policy, accessibility (.html)
- `blog/` artikel, `images/` foto dan logo, `assets/` tampilan dan fungsi
- `build.js` script otomatis (daftar blog, sitemap, cek link)
- `_redirects` pengalihan link lama Wix, `robots.txt`, `favicon.ico`

## Pengaturan Cloudflare Pages
Build command: `node build.js`  |  Build output directory: `dist`

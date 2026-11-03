#!/usr/bin/env node
/*
  Build Hospio Solutions
  - Menyalin website ke folder dist/ (folder inilah yang ditayangkan)
  - Membaca blok info di tiap artikel blog/*.html, lalu mengisi daftar di blog.html
  - Membuat sitemap.xml otomatis
  - Mengecek link dan foto yang salah ketik (hanya memberi peringatan)
  Tidak butuh instalasi paket apa pun, cukup Node.js.
*/
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'dist');
const SITE = 'https://www.hospiosolutions.com';
const PAGES = ['/', '/services', '/about-us', '/contact', '/blog', '/privacy-policy', '/accessibility'];
const IGNORE_ROOT = new Set(['dist', 'node_modules', '.git', '.github', '.gitignore', 'build.js',
  'package.json', 'package-lock.json', 'README.md', 'vercel.json']);

const warnings = [];
const warn = (m) => { warnings.push(m); console.warn('PERINGATAN: ' + m); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 1. Salin semua file ke dist/ (template artikel yang diawali "_" tidak ikut tayang)
function copyDir(src, dst, rel) {
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (!rel && IGNORE_ROOT.has(name)) continue;
    if (name === '.DS_Store' || name === 'Thumbs.db') continue;
    if (rel === 'blog' && name.startsWith('_')) continue;
    const s = path.join(src, name), d = path.join(dst, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d, rel ? rel + '/' + name : name);
    else fs.copyFileSync(s, d);
  }
}
fs.rmSync(OUT, { recursive: true, force: true });
copyDir(ROOT, OUT, '');

// 2. Baca blok info tiap artikel
function readArticle(file) {
  const slug = file.replace(/\.html$/, '');
  const html = fs.readFileSync(path.join(ROOT, 'blog', file), 'utf8');
  const block = [...html.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]).find((b) => /^\s*title\s*:/m.test(b));
  if (!block) return { skip: 'blok info di bagian atas file tidak ditemukan' };
  const info = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*([A-Za-z]+)\s*:\s*(.*?)\s*$/);
    if (m) info[m[1]] = m[2];
  }
  for (const k of ['title', 'date', 'excerpt']) if (!info[k]) return { skip: `isian "${k}" kosong atau tidak ada` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(info.date) || isNaN(new Date(info.date + 'T00:00:00Z'))) {
    return { skip: `format tanggal "${info.date}" salah, harus seperti 2026-03-15` };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) warn(`blog/${file}: nama file sebaiknya huruf kecil, angka, dan tanda hubung saja.`);
  return { slug, file, title: info.title, date: info.date, author: info.author || 'Hendrik Arysta',
    readTime: info.readTime || '', excerpt: info.excerpt, image: info.image || '' };
}

const articles = [];
const blogDir = path.join(ROOT, 'blog');
if (fs.existsSync(blogDir)) {
  for (const f of fs.readdirSync(blogDir).sort()) {
    if (!f.endsWith('.html') || f.startsWith('_')) continue;
    const a = readArticle(f);
    if (a.skip) warn(`blog/${f} dilewati dari daftar: ${a.skip}.`);
    else articles.push(a);
  }
}
articles.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-US',
  { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const imgExists = (n) => n && fs.existsSync(path.join(ROOT, 'images', n));

function card(a) {
  const hasImg = imgExists(a.image);
  if (a.image && !hasImg) warn(`blog/${a.file}: foto "${a.image}" tidak ada di folder images/, kartu tampil tanpa foto.`);
  const avatar = `${a.author.split(' ')[0].toLowerCase()}-avatar.jpg`;
  const av = imgExists(avatar) ? `<img class="avatar" src="/images/${avatar}" alt="" width="40" height="40">` : '';
  const pic = hasImg
    ? `<div class="imgbox post-img"><img src="/images/${esc(a.image)}" alt="" loading="lazy" decoding="async"></div>`
    : '<div class="ph post-img" aria-hidden="true"></div>';
  const meta = fmtDate(a.date) + (a.readTime ? ' · ' + esc(a.readTime) : '');
  return `<article class="post-card">${pic}<div><div class="byline">${av}<div><span class="name">${esc(a.author)}</span><span>${meta}</span></div></div>` +
    `<h2><a href="/blog/${a.slug}">${esc(a.title)}</a></h2><p>${esc(a.excerpt)}</p></div></article>`;
}

// 3. Isi daftar di dist/blog.html
const blogFile = path.join(OUT, 'blog.html');
let blog = fs.readFileSync(blogFile, 'utf8');
const re = /(<!-- BLOG-LIST-START -->)[\s\S]*?(<!-- BLOG-LIST-END -->)/;
if (!re.test(blog)) throw new Error('blog.html tidak punya penanda BLOG-LIST-START dan BLOG-LIST-END.');
blog = blog.replace(re, (m, a, z) => a + '\n' + articles.map(card).join('\n') + '\n' + z);
fs.writeFileSync(blogFile, blog);

// 4. sitemap.xml
const urls = PAGES.map((p) => ({ loc: p })).concat(articles.map((a) => ({ loc: '/blog/' + a.slug, lastmod: a.date })));
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${SITE}${u.loc === '/' ? '/' : u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n') +
  '\n</urlset>\n');

// 5. Cek link dan foto yang salah ketik
function htmlFiles(dir) {
  return fs.readdirSync(dir).flatMap((n) => {
    const p = path.join(dir, n);
    return fs.statSync(p).isDirectory() ? htmlFiles(p) : n.endsWith('.html') ? [p] : [];
  });
}
const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
function targetExists(u) {
  const clean = u.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return true;
  const p = clean.replace(/^\//, '');
  return [p, p + '.html', path.join(p, 'index.html')].some((c) => isFile(path.join(OUT, c)));
}
for (const f of htmlFiles(OUT)) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g)) {
    if (!targetExists(m[1])) warn(`${path.relative(OUT, f)}: "${m[1]}" tidak ditemukan.`);
  }
}

console.log(`Selesai: ${articles.length} artikel masuk daftar blog, ${warnings.length} peringatan.`);

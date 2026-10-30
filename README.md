# MLBB Shop - Bagian Orang 1

Project Express 5 + TypeScript + Prisma 7 + PostgreSQL Neon.

## 1. Persiapan
1. Install Node.js versi LTS dan Git.
2. Buka folder ini di VS Code.
3. Jalankan `npm install`.
4. Salin `.env.example` menjadi `.env`.
5. Isi DATABASE_URL dengan pooled connection string Neon dan DIRECT_URL dengan direct connection string Neon.
6. Unduh dataset dari tautan pada modul, lalu letakkan `heroes.json` dan `skins.json` di folder `data/`.

## 2. Database
Jalankan:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 3. Seed
Jalankan:
```bash
npm run db:seed
```
Pastikan hasilnya 133 hero, 892 skin, dan 3 player.

## 4. Jalankan server
```bash
npm run dev
```
Buka `http://localhost:3000/health`.

## 5. Endpoint Orang 1
- GET `/health`
- GET `/api/heroes?page=1&limit=10`
- GET `/api/heroes?search=la`
- GET `/api/heroes?role=MARKSMAN`
- GET `/api/heroes/18`
- POST `/api/heroes`
- GET `/api/skins?page=1&limit=10`
- GET `/api/skins?heroId=18`
- GET `/api/skins?rarity=GRAND`
- GET `/api/skins/10`

## Catatan
- File `.env` tidak boleh di-commit ke GitHub.
- Fitur Player, Top Up, Match, Beli Hero, dan Statistik merupakan bagian Orang 2.
- Sesuaikan enum dengan dataset jika ditemukan nilai dataset yang berbeda dari enum pada modul.

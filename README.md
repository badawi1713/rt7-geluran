# Arisan RT 7 Geluran

Dashboard arisan RT 7 Geluran, Taman, Sidoarjo. Ini port dari
[neighborhood-association](https://github.com/badawi1713/neighborhood-association) (CRA + MUI + Redux)
ke Vite + React 19 + TypeScript, TanStack Query, shadcn/ui, dan React Router.

```bash
cp .env.example .env   # VITE_API_BASE_URL
npm install
npm run dev
```

## Struktur

| Path | Isi |
| --- | --- |
| `src/lib/api.ts` | Instance axios dan interceptor token |
| `src/lib/query-client.ts` | QueryClient, toast error/sukses global lewat `meta` |
| `src/features/*/api.ts` | Endpoint dan hook query/mutation per modul |
| `src/features/auth/auth-provider.tsx` | Sesi login, auto-logout saat token kedaluwarsa |
| `src/pages/*` | Halaman |

## Token kedaluwarsa

- **Sebelum request:** jika `exp` JWT sudah lewat, request dibatalkan dan sesi diakhiri.
- **Respons 401:** sesi diakhiri, kecuali untuk request login (401 di sana artinya password salah).
- **Saat diam:** timer logout otomatis tepat pada `exp`.
- **Saat dibuka ulang:** token lama divalidasi ke `/v1/api/access-token`.

Saat sesi diakhiri, token dihapus, cache query dibersihkan, toast "sesi sudah berakhir" muncul sekali saja,
lalu pengguna diarahkan ke `/sign-in`. Setelah login ulang, pengguna dikembalikan ke halaman terakhirnya.
API tidak menyediakan endpoint refresh token, jadi sesi tidak bisa diperpanjang diam-diam.

## Keyboard

| Tombol | Fungsi |
| --- | --- |
| `/` | Fokus ke kotak pencarian |
| `Alt+N` | Tambah data (Anggota, Anggota Arisan, Pertemuan) |
| `Alt+B` / `Alt+M` | Bayar / Tagihan manual (Transaksi) |
| `Ctrl/⌘+B` | Buka/tutup sidebar |
| Dialog Bayar | `Enter`/`↓` cari anggota, `Enter` pilih, `↑↓` pindah tagihan, `Spasi` centang, `Enter` bayar, `Enter` konfirmasi |

Dialog konfirmasi hapus memberi fokus awal ke "Batal", supaya `Enter` tidak langsung menghapus data.

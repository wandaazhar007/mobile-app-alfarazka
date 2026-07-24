// Mirror frontend/src/utils/format.ts — dipakai di manapun ada uang/tanggal.

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// 'panjang' -> "Senin, 8 Juli 2026"
// 'pendek'  -> "08/07/2026"
// 'dash'    -> "08-Juli-2026" (badge rentang tanggal terpilih)
export function formatTanggal(date: string | Date, style: 'panjang' | 'pendek' | 'dash' = 'pendek'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (style === 'panjang') {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(d);
  }

  if (style === 'dash') {
    const parts = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    return `${get('day')}-${get('month')}-${get('year')}`;
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(d);
}

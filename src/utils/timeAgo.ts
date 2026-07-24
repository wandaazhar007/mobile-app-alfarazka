// Dipakai SellerMapScreen buat tandai ping yang sudah lama (kemungkinan HP mati/offline)
// beda dengan yang baru saja masuk — bukan dipakai di web, khusus kebutuhan mobile map.
export function minutesAgo(isoDate: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(isoDate).getTime()) / 60000));
}

export function formatTimeAgo(isoDate: string): string {
  const minutes = minutesAgo(isoDate);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}

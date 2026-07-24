import * as Notifications from 'expo-notifications';
import { navigateToOwnerTab } from '../navigation/navigationRef';
import type { OwnerTabsParamList } from '../navigation/OwnerTabs';

// Owner belum punya screen khusus buat semua jenis notifikasi (mis. stok pagi &
// pengeluaran besar) — yang belum ada layarnya diarahkan ke Dashboard sebagai
// fallback yang paling relevan, bukan dibiarkan tanpa navigasi sama sekali.
const NOTIFICATION_TYPE_TO_TAB: Record<string, keyof OwnerTabsParamList> = {
  'morning-stock': 'Dashboard',
  setoran: 'Laporan',
  'daily-closing': 'Laporan',
  'unsettled-sellers': 'Laporan',
  'seller-loan': 'UtangPenjual',
  'large-expense': 'Dashboard',
  'receivable-overdue': 'Dashboard',
};

function handleResponse(response: Notifications.NotificationResponse) {
  const type = response.notification.request.content.data?.type as string | undefined;
  const tab = type ? NOTIFICATION_TYPE_TO_TAB[type] : undefined;
  if (tab) navigateToOwnerTab(tab);
}

// Dipanggil sekali di App.tsx (module scope, sama seperti backgroundLocationTask) —
// menangani kasus app SUDAH terbuka/background lalu notifikasi di-tap. NavigationContainer
// sudah pasti ready di titik ini (app sedang berjalan), jadi aman dipanggil langsung.
export function setupNotificationNavigation() {
  Notifications.addNotificationResponseReceivedListener(handleResponse);
}

// Dipanggil terpisah dari NavigationContainer.onReady (lihat RootNavigator) — menangani
// app dibuka PERTAMA KALI lewat tap notifikasi saat sebelumnya ter-kill total. Tidak bisa
// digabung ke listener di atas karena navigationRef belum tentu ready saat App.tsx mount,
// sedangkan onReady menjamin itu.
export async function checkInitialNotificationNavigation() {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) handleResponse(response);
}

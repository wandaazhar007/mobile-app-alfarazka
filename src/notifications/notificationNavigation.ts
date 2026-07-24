import * as Notifications from 'expo-notifications';
import { navigateToOwnerTab } from '../navigation/navigationRef';
import type { OwnerTabsParamList } from '../navigation/OwnerTabs';

type Destination = { tab: keyof OwnerTabsParamList; params?: OwnerTabsParamList[keyof OwnerTabsParamList] };

// Stok Pagi/Pengeluaran/Piutang sekarang punya layar sendiri (di dalam stack tab
// Dashboard, lihat DashboardStack) — jadi notifikasi jenis itu diarahkan LANGSUNG
// ke layarnya, bukan cuma ke tab Dashboard polos.
const NOTIFICATION_TYPE_TO_DESTINATION: Record<string, Destination> = {
  'morning-stock': { tab: 'Dashboard', params: { screen: 'StokPagi' } },
  setoran: { tab: 'Laporan' },
  'daily-closing': { tab: 'Laporan' },
  'unsettled-sellers': { tab: 'Laporan' },
  'seller-loan': { tab: 'UtangPenjual' },
  'large-expense': { tab: 'Dashboard', params: { screen: 'Pengeluaran' } },
  'receivable-overdue': { tab: 'Dashboard', params: { screen: 'Piutang' } },
};

function handleResponse(response: Notifications.NotificationResponse) {
  const type = response.notification.request.content.data?.type as string | undefined;
  const destination = type ? NOTIFICATION_TYPE_TO_DESTINATION[type] : undefined;
  if (destination) navigateToOwnerTab(destination.tab, destination.params);
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

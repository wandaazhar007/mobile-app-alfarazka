import { navigateToOwnerTab } from '../navigation/navigationRef';
import type { OwnerTabsParamList } from '../navigation/OwnerTabs';

type Destination = { tab: keyof OwnerTabsParamList; params?: OwnerTabsParamList[keyof OwnerTabsParamList] };

// Dipakai baik oleh tap push notification (notificationNavigation.ts) MAUPUN tap item
// di modal riwayat notifikasi in-app (components/NotificationsModal.tsx) — satu sumber
// kebenaran supaya keduanya konsisten. Stok Pagi/Pengeluaran/Piutang sudah punya layar
// sendiri (di dalam stack tab Dashboard, lihat DashboardStack) jadi diarahkan langsung
// ke situ, bukan cuma ke tab Dashboard polos.
const NOTIFICATION_TYPE_TO_DESTINATION: Record<string, Destination> = {
  'morning-stock': { tab: 'Dashboard', params: { screen: 'StokPagi' } },
  setoran: { tab: 'Laporan' },
  'daily-closing': { tab: 'Laporan' },
  'unsettled-sellers': { tab: 'Laporan' },
  'seller-loan': { tab: 'UtangPenjual' },
  'large-expense': { tab: 'Dashboard', params: { screen: 'Pengeluaran' } },
  'receivable-overdue': { tab: 'Dashboard', params: { screen: 'Piutang' } },
};

export function navigateToNotificationType(type: string | null | undefined) {
  const destination = type ? NOTIFICATION_TYPE_TO_DESTINATION[type] : undefined;
  if (destination) navigateToOwnerTab(destination.tab, destination.params);
}

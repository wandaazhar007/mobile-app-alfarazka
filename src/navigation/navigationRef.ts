import { createNavigationContainerRef } from '@react-navigation/native';
import type { OwnerTabsParamList } from './OwnerTabs';

// Module-scope ref (bukan lewat props) — supaya kode DI LUAR pohon komponen
// (notification tap handler, lihat notifications/notificationNavigation.ts) tetap
// bisa navigasi tanpa perlu context/prop-drilling sampai ke situ.
export const navigationRef = createNavigationContainerRef<OwnerTabsParamList>();

export function navigateToOwnerTab(name: keyof OwnerTabsParamList) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name);
  }
}

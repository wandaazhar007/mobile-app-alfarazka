import { createNavigationContainerRef } from '@react-navigation/native';
import type { OwnerTabsParamList } from './OwnerTabs';

// Module-scope ref (bukan lewat props) — supaya kode DI LUAR pohon komponen
// (notification tap handler, lihat notifications/notificationNavigation.ts) tetap
// bisa navigasi tanpa perlu context/prop-drilling sampai ke situ.
export const navigationRef = createNavigationContainerRef<OwnerTabsParamList>();

export function navigateToOwnerTab<Name extends keyof OwnerTabsParamList>(
  name: Name,
  params?: OwnerTabsParamList[Name]
) {
  if (navigationRef.isReady()) {
    // React Navigation's overloaded `navigate` type doesn't infer well through a
    // generic wrapper like this — the (name, params) shape itself is correct.
    (navigationRef.navigate as (name: Name, params?: OwnerTabsParamList[Name]) => void)(name, params);
  }
}

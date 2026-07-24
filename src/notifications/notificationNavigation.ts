import * as Notifications from 'expo-notifications';
import { navigateToNotificationType } from './notificationDestinations';

function handleResponse(response: Notifications.NotificationResponse) {
  const type = response.notification.request.content.data?.type as string | undefined;
  navigateToNotificationType(type);
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

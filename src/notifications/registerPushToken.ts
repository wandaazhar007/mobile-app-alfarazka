import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../services/api';

// Dipanggil sekali tiap kali ada user login (lihat AuthContext) — gagal di sini
// (izin ditolak, bukan device fisik, dll) TIDAK BOLEH memblokir login, jadi semua
// error ditelan di sini, bukan dilempar ke pemanggil.
export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return; // push token tidak valid di simulator/emulator

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return;

    const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync({
      projectId: '3d775ac6-6948-42ed-9a2e-762a553a5298',
    });
    await api.post('/api/push-token', { expoPushToken });
  } catch {
    // best-effort, lihat komentar di atas
  }
}

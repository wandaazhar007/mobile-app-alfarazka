import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';
import NotificationsModal from './NotificationsModal';
import api from '../services/api';
import type { AppNotification } from '../types/notification';

// Navbar custom dipakai di SEMUA halaman utama (dashboard penjual, dan 5 tab owner) —
// judul rata kiri + lonceng notifikasi & tombol logout (dengan konfirmasi) rata kanan.
// Native stack header sengaja tidak dipakai (headerTitleAlign tidak konsisten
// pixel-perfect di iOS), jadi tiap screen render komponen ini sendiri di paling atas.
export default function AppNavbar() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api
      .get<{ notifications: AppNotification[]; unreadCount: number }>('/api/notifications')
      .then(({ data }) => setUnreadCount(data.unreadCount))
      .catch(() => {});
  }, []);

  return (
    <>
      <View style={[styles.navbar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.navbarTitle}>Alfarazka Bakery</Text>
        <View style={styles.navbarActions}>
          <Pressable style={styles.navbarIconButton} onPress={() => setNotificationsVisible(true)} hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color="#111827" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable style={styles.navbarIconButton} onPress={() => setConfirmVisible(true)} hitSlop={8}>
            <Ionicons name="log-out-outline" size={22} color="#dc2626" />
          </Pressable>
        </View>
      </View>
      <NotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        onUnreadCountChange={setUnreadCount}
      />
      <ConfirmModal
        visible={confirmVisible}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin mau logout?"
        confirmLabel="Ya, Keluar"
        danger
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => {
          setConfirmVisible(false);
          logout();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navbarTitle: { fontSize: 18, fontWeight: '700', color: '#e63946' },
  navbarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  navbarIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e63946',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});

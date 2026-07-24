import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';

// Navbar custom dipakai di SEMUA halaman utama (dashboard penjual, dan 5 tab owner) —
// judul rata kiri + tombol logout (dengan konfirmasi) rata kanan. Native stack header
// sengaja tidak dipakai (headerTitleAlign tidak konsisten pixel-perfect di iOS), jadi
// tiap screen render komponen ini sendiri di paling atas.
export default function AppNavbar() {
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [confirmVisible, setConfirmVisible] = useState(false);

  return (
    <>
      <View style={[styles.navbar, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.navbarTitle}>Alfarazka Bakery</Text>
        <Pressable style={styles.navbarLogoutButton} onPress={() => setConfirmVisible(true)} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color="#dc2626" />
        </Pressable>
      </View>
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
  navbarLogoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Pressable, ActivityIndicator, Linking, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LOCATION_TASK_NAME } from '../../location/backgroundLocationTask';
import { requestLocationPermissions, getCurrentPermissionStatus, type PermissionOutcome } from '../../location/permissions';
import { flushQueue, getQueueSize } from '../../location/locationQueue';

const TRACKING_OPTIONS: Location.LocationTaskOptions = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 60000,
  // 0 (bukan 50m seperti sebelumnya) — Android men-throttle update berdasarkan
  // displacement ini SEBELUM cek timeInterval, jadi kalau HP diam di tempat (parkir,
  // nunggu pelanggan, dll) TIDAK ADA update terkirim sama sekali walau timeInterval
  // sudah lewat. Owner butuh "detak jantung" rutin tiap ~1 menit buat tahu penjual
  // masih online, terlepas dia bergerak atau tidak — jadi displacement filter ini
  // dimatikan, murni time-based.
  distanceInterval: 0,
  // Notifikasi persisten WAJIB (bukan opsional) selama tracking background aktif —
  // dipersyaratkan Android, dan transparansi ke penjual bahwa app sedang melacak.
  foregroundService: {
    notificationTitle: 'Alfarazka Bakery',
    notificationBody: 'Sedang melacak lokasi Anda selama berjualan keliling',
    notificationColor: '#e63946',
  },
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: true,
};

export default function LocationTrackingScreen() {
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [permission, setPermission] = useState<PermissionOutcome>('denied');
  const [busy, setBusy] = useState(false);
  const [queueSize, setQueueSize] = useState(0);

  const refreshStatus = useCallback(async () => {
    const [started, permissionStatus, size] = await Promise.all([
      Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME),
      getCurrentPermissionStatus(),
      getQueueSize(),
    ]);
    setTracking(started);
    setPermission(permissionStatus);
    setQueueSize(size);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleToggle = async (value: boolean) => {
    setBusy(true);
    try {
      if (value) {
        const outcome = await requestLocationPermissions();
        setPermission(outcome);
        if (outcome === 'denied') {
          setBusy(false);
          return;
        }
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, TRACKING_OPTIONS);
      } else {
        const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
    } finally {
      await refreshStatus();
      setBusy(false);
    }
  };

  const handleFlushNow = async () => {
    setBusy(true);
    await flushQueue();
    await refreshStatus();
    setBusy(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.disclosureCard}>
        <Ionicons name="information-circle" size={22} color="#1d4ed8" style={styles.disclosureIcon} />
        <Text style={styles.disclosureText}>
          Kalau diaktifkan, Alfarazka Bakery akan mencatat lokasi Anda kira-kira tiap 1 menit selama Anda berjualan
          keliling — termasuk saat aplikasi ditutup atau layar terkunci — supaya posisi Anda tercatat di peta kantor
          untuk koordinasi & keamanan. Notifikasi akan selalu tampil di HP Anda selama fitur ini aktif, dan Anda bisa
          matikan kapan saja lewat halaman ini.
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleLabel}>Lacak Lokasi Saya</Text>
          <Text style={styles.toggleStatus}>
            {tracking ? 'Aktif' : 'Nonaktif'}
            {tracking && permission === 'foreground-only' ? ' (cuma saat app dibuka)' : ''}
          </Text>
        </View>
        {busy ? <ActivityIndicator color="#e63946" /> : <Switch value={tracking} onValueChange={handleToggle} trackColor={{ true: '#e63946' }} />}
      </View>

      {permission === 'foreground-only' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Izin lokasi latar belakang belum diberikan — tracking cuma jalan selagi aplikasi ini terbuka. Untuk lacak
            walau app ditutup/HP terkunci, buka Pengaturan HP dan ubah izin lokasi Alfarazka Bakery jadi &quot;Selalu
            Izinkan&quot;.
          </Text>
          <Pressable style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>Buka Pengaturan</Text>
          </Pressable>
        </View>
      )}

      {permission === 'denied' && (
        <View style={styles.warningCard}>
          <Text style={styles.warningText}>
            Izin lokasi belum diberikan sama sekali. Aktifkan toggle di atas untuk diminta izin, atau buka Pengaturan
            HP kalau sebelumnya sudah pernah ditolak.
          </Text>
          <Pressable style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.settingsButtonText}>Buka Pengaturan</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.queueRow}>
        <Text style={styles.queueText}>
          {queueSize === 0 ? 'Semua posisi sudah terkirim.' : `${queueSize} posisi menunggu terkirim (belum ada sinyal/masih diproses).`}
        </Text>
        {queueSize > 0 && (
          <Pressable style={styles.flushButton} onPress={handleFlushNow} disabled={busy}>
            <Text style={styles.flushButtonText}>Kirim Sekarang</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  disclosureCard: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  disclosureIcon: { marginTop: 1 },
  disclosureText: { flex: 1, fontSize: 13, color: '#1e3a8a', lineHeight: 19 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  toggleTextWrap: { flex: 1, paddingRight: 12 },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  toggleStatus: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  warningCard: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  warningText: { fontSize: 13, color: '#92400e', lineHeight: 19, marginBottom: 10 },
  settingsButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#92400e',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  settingsButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  queueRow: { alignItems: 'flex-start', gap: 10 },
  queueText: { fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  flushButton: {
    backgroundColor: '#111827',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  flushButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

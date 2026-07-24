import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../services/api';
import AppNavbar from '../../components/AppNavbar';
import type { LokasiPenjualStackParamList } from '../../navigation/LokasiPenjualStack';
import type { SellerPosition } from '../../types/sellerLocation';
import { formatTimeAgo, minutesAgo } from '../../utils/timeAgo';

// Polling, bukan WebSocket (dikonfirmasi cukup) — 15 detik, di tengah rentang
// 10-30 detik yang direncanakan. Ping GPS di HP penjual sendiri defaultnya tiap
// 60 detik, jadi polling lebih cepat dari itu cuma bikin UI kelihatan responsif
// begitu ping baru masuk, bukan berarti datanya update tiap 15 detik beneran.
const POLL_INTERVAL_MS = 15000;

// Ping lebih tua dari ini dianggap "kemungkinan offline" (HP mati/app di-kill/tanpa
// sinyal) — ditandai abu-abu di peta & list, bukan dihapus dari tampilan.
const STALE_MINUTES = 10;

const INITIAL_REGION = {
  // Jakarta — cuma titik awal peta sebelum data pertama masuk, bukan asumsi lokasi bisnis.
  latitude: -6.2088,
  longitude: 106.8456,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export default function SellerMapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LokasiPenjualStackParamList, 'SellerMap'>>();

  const [positions, setPositions] = useState<SellerPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mapRef = useRef<MapView>(null);
  const hasCenteredOnce = useRef(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<SellerPosition[]>('/api/sellers/locations');
      setPositions(data);
      setError(false);

      if (!hasCenteredOnce.current && data.length > 0 && mapRef.current) {
        hasCenteredOnce.current = true;
        mapRef.current.fitToCoordinates(
          data.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
          { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
        );
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  const goToTrail = (position: SellerPosition) => {
    navigation.navigate('SellerTrail', { sellerId: position.sellerId, sellerName: position.sellerName });
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <AppNavbar />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e63946" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppNavbar />
      <View style={styles.mapWrap}>
        <MapView ref={mapRef} provider={PROVIDER_DEFAULT} style={styles.map} initialRegion={INITIAL_REGION}>
          {positions.map((p) => {
            const stale = minutesAgo(p.recordedAt) > STALE_MINUTES;
            return (
              <Marker
                key={p.sellerId}
                coordinate={{ latitude: p.latitude, longitude: p.longitude }}
                title={p.sellerName}
                description={formatTimeAgo(p.recordedAt)}
                pinColor={stale ? '#9ca3af' : '#e63946'}
                onCalloutPress={() => goToTrail(p)}
              />
            );
          })}
        </MapView>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Penjual Aktif Hari Ini ({positions.length})</Text>
        {error && <Text style={styles.errorText}>Gagal memuat posisi terbaru.</Text>}
      </View>

      <FlatList
        style={styles.list}
        data={positions}
        keyExtractor={(p) => p.sellerId}
        ListEmptyComponent={<Text style={styles.emptyText}>Belum ada penjual yang mengirim posisi hari ini.</Text>}
        renderItem={({ item }) => {
          const stale = minutesAgo(item.recordedAt) > STALE_MINUTES;
          return (
            <Pressable style={styles.row} onPress={() => goToTrail(item)}>
              <View style={[styles.dot, stale && styles.dotStale]} />
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{item.sellerName}</Text>
                <Text style={[styles.rowTime, stale && styles.rowTimeStale]}>{formatTimeAgo(item.recordedAt)}</Text>
              </View>
              {item.batteryLevel !== null && <Text style={styles.rowBattery}>{Math.round(item.batteryLevel)}%</Text>}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  listHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  listTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  errorText: { fontSize: 12, color: '#dc2626', marginTop: 2 },
  list: { maxHeight: 220 },
  emptyText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic', paddingHorizontal: 16, paddingVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e63946' },
  dotStale: { backgroundColor: '#9ca3af' },
  rowText: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rowTime: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  rowTimeStale: { color: '#9ca3af' },
  rowBattery: { fontSize: 12, color: '#6b7280' },
});

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../../services/api';
import type { LokasiPenjualStackParamList } from '../../navigation/LokasiPenjualStack';
import type { SellerPosition } from '../../types/sellerLocation';
import { formatTimeAgo } from '../../utils/timeAgo';

type Props = NativeStackScreenProps<LokasiPenjualStackParamList, 'SellerTrail'>;

// Breadcrumb 1 penjual/hari-ini — snapshot statis (tidak polling), beda dengan
// SellerMapScreen yang live. Dibuka dari tap marker/list di peta utama.
export default function SellerTrailScreen({ route }: Props) {
  const { sellerId } = route.params;
  const [points, setPoints] = useState<SellerPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get<SellerPosition[]>(`/api/sellers/${sellerId}/location-trail`);
        setPoints(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sellerId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  if (error || points.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>
          {error ? 'Gagal memuat jejak lokasi.' : 'Belum ada data lokasi untuk penjual ini hari ini.'}
        </Text>
      </View>
    );
  }

  const last = points[points.length - 1];
  const first = points[0];
  const coordinates = points.map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={{
          latitude: last.latitude,
          longitude: last.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Polyline coordinates={coordinates} strokeColor="#e63946" strokeWidth={3} />
        <Marker coordinate={{ latitude: first.latitude, longitude: first.longitude }} title="Titik Awal" pinColor="#22c55e" />
        <Marker
          coordinate={{ latitude: last.latitude, longitude: last.longitude }}
          title="Posisi Terakhir"
          description={formatTimeAgo(last.recordedAt)}
          pinColor="#e63946"
        />
      </MapView>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{points.length} titik tercatat hari ini</Text>
        <Text style={styles.footerText}>Terakhir: {formatTimeAgo(last.recordedAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 24 },
  emptyText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  footerText: { fontSize: 12, color: '#6b7280' },
});

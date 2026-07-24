import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatRupiah, formatTanggal } from '../../utils/format';
import todayJakarta from '../../utils/todayJakarta';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import AppNavbar from '../../components/AppNavbar';
import { SkeletonBlock, SkeletonStatCardRow, SkeletonChart, SkeletonBadge } from '../../components/Skeleton';
import { LOCATION_TASK_NAME } from '../../location/backgroundLocationTask';
import type { SellerStackParamList } from '../../navigation/SellerStack';
import type { StockMovement } from '../../types/stockMovement';
import type { SellerMySales } from '../../types/sellerMySales';
import type { SellerEarnings } from '../../types/sellerPayroll';

function daysAgoJakarta(days: number): string {
  const [y, m, d] = todayJakarta().split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

interface TrendPoint {
  date: string;
  total: number;
}

// Preset rentang tanggal, bukan date-picker native (@react-native-community/datetimepicker
// belum dipasang) — cukup untuk kebutuhan "lihat cepat" di HP, reuse endpoint yang sama
// persis dengan frontend/src/pages/seller/SellerDashboard.tsx.
type RangePreset = 'today' | '7d' | '30d';

function presetToRange(preset: RangePreset): { from: string; to: string } {
  const to = todayJakarta();
  if (preset === 'today') return { from: to, to };
  if (preset === '7d') return { from: daysAgoJakarta(6), to };
  return { from: daysAgoJakarta(29), to };
}

export default function SellerDashboardScreen() {
  const { appUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<SellerStackParamList, 'SellerDashboard'>>();
  const [locationTracking, setLocationTracking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).then(setLocationTracking);
    }, [])
  );

  const [preset, setPreset] = useState<RangePreset>('today');
  const [todayStock, setTodayStock] = useState<StockMovement[]>([]);
  const [mySales, setMySales] = useState<SellerMySales | null>(null);
  const [myDebt, setMyDebt] = useState(0);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [earnings, setEarnings] = useState<SellerEarnings | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const { from, to } = presetToRange(preset);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(false);
      try {
        const [stockRes, salesRes, debtRes, trendRes, earningsRes] = await Promise.all([
          api.get<StockMovement[]>('/api/seller/today-stock'),
          api.get<SellerMySales>('/api/seller/my-sales', { params: { from, to } }),
          api.get<{ outstanding: number }>('/api/seller/my-debt'),
          api.get<TrendPoint[]>('/api/seller/my-sales-trend', { params: { from, to } }),
          api.get<SellerEarnings>('/api/seller/my-earnings', { params: { from, to } }),
        ]);
        setTodayStock(stockRes.data);
        setMySales(salesRes.data);
        setMyDebt(debtRes.data.outstanding);
        setTrendData(trendRes.data);
        setEarnings(earningsRes.data);
      } catch {
        setError(true);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const maxTrendTotal = Math.max(1, ...trendData.map((p) => p.total));

  return (
    <View style={styles.screen}>
      <AppNavbar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
      <View style={styles.header}>
        <Text style={styles.title}>{appUser?.name}</Text>
        <Text style={styles.subtitle}>Dashboard Penjual</Text>
      </View>

      <Pressable style={styles.locationBanner} onPress={() => navigation.navigate('LocationTracking')}>
        <View style={[styles.locationDot, locationTracking && styles.locationDotActive]} />
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationTitle}>Lacak Lokasi</Text>
          <Text style={styles.locationStatus}>{locationTracking ? 'Aktif' : 'Nonaktif — tap untuk atur'}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </Pressable>

      <View style={styles.presetRow}>
        {(['today', '7d', '30d'] as RangePreset[]).map((p) => (
          <Pressable
            key={p}
            onPress={() => setPreset(p)}
            style={[styles.presetButton, preset === p && styles.presetButtonActive]}
          >
            <Text style={[styles.presetText, preset === p && styles.presetTextActive]}>
              {p === 'today' ? 'Hari Ini' : p === '7d' ? '7 Hari' : '30 Hari'}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Stok Hari Ini</Text>
              <Badge tone="success">{formatTanggal(todayJakarta(), 'dash')}</Badge>
            </View>
            <View style={styles.stockTable}>
              <View style={[styles.stockRow, styles.stockHeaderRow]}>
                <Text style={[styles.stockCell, styles.stockCellProduct, styles.stockHeaderText]}>Produk</Text>
                <Text style={[styles.stockCell, styles.stockHeaderText]}>Keluar</Text>
                <Text style={[styles.stockCell, styles.stockHeaderText]}>Retur</Text>
                <Text style={[styles.stockCell, styles.stockHeaderText]}>Terjual</Text>
              </View>
              {[0, 1, 2].map((i) => (
                <View key={i} style={styles.stockRow}>
                  <View style={styles.stockCellProduct}>
                    <SkeletonBlock style={styles.skeletonLine} />
                  </View>
                  <View style={styles.stockCell}>
                    <SkeletonBlock style={[styles.skeletonLine, styles.skeletonLineRight]} />
                  </View>
                  <View style={styles.stockCell}>
                    <SkeletonBlock style={[styles.skeletonLine, styles.skeletonLineRight]} />
                  </View>
                  <View style={styles.stockCell}>
                    <SkeletonBlock style={[styles.skeletonLine, styles.skeletonLineRight]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekap Penjualan</Text>
            <View style={styles.selectedRangeRow}>
              <SkeletonBadge width={110} />
            </View>
            <SkeletonStatCardRow count={4} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tren Penjualan</Text>
            <SkeletonChart />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Penghasilan</Text>
            <View style={styles.selectedRangeRow}>
              <SkeletonBadge width={110} />
            </View>
            <SkeletonStatCardRow count={6} />
          </View>
        </>
      ) : error ? (
        <View style={styles.section}>
          <Text style={styles.errorText}>Gagal memuat data.</Text>
          <Pressable onPress={() => load()} style={styles.retryButton}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Stok Hari Ini</Text>
              <Badge tone="success">{formatTanggal(todayJakarta(), 'dash')}</Badge>
            </View>
            {todayStock.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada stok yang diinput untuk hari ini.</Text>
            ) : (
              <View style={styles.stockTable}>
                <View style={[styles.stockRow, styles.stockHeaderRow]}>
                  <Text style={[styles.stockCell, styles.stockCellProduct, styles.stockHeaderText]}>Produk</Text>
                  <Text style={[styles.stockCell, styles.stockHeaderText]}>Keluar</Text>
                  <Text style={[styles.stockCell, styles.stockHeaderText]}>Retur</Text>
                  <Text style={[styles.stockCell, styles.stockHeaderText]}>Terjual</Text>
                </View>
                {todayStock.map((m) => (
                  <View key={m.id} style={styles.stockRow}>
                    <Text style={[styles.stockCell, styles.stockCellProduct]}>{m.productName}</Text>
                    <Text style={styles.stockCell}>{m.qtyOut}</Text>
                    <Text style={styles.stockCell}>{m.qtyReturned}</Text>
                    <Text style={styles.stockCell}>{m.qtySold}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rekap Penjualan</Text>
            <View style={styles.selectedRangeRow}>
              <Badge tone="success">
                {from === to ? formatTanggal(from, 'dash') : `${formatTanggal(from, 'dash')} s/d ${formatTanggal(to, 'dash')}`}
              </Badge>
            </View>
            {mySales && (
              <View style={styles.statGrid}>
                <StatCard label="Setoran Cash" value={formatRupiah(mySales.cash)} />
                <StatCard label="Settlement QRIS" value={formatRupiah(mySales.qris)} />
                <StatCard label="Total Penjualan" value={formatRupiah(mySales.totalPenjualan)} variant="highlight" />
                <StatCard label="Utang Saat Ini" value={formatRupiah(myDebt)} />
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tren Penjualan</Text>
            {trendData.length === 0 ? (
              <Text style={styles.emptyText}>Belum ada data penjualan pada rentang ini.</Text>
            ) : (
              <View style={styles.trendChart}>
                {trendData.map((point) => (
                  <View key={point.date} style={styles.trendRow}>
                    <Text style={styles.trendDate}>{formatTanggal(point.date, 'pendek')}</Text>
                    <View style={styles.trendBarTrack}>
                      <View
                        style={[styles.trendBarFill, { width: `${(point.total / maxTrendTotal) * 100}%` }]}
                      />
                    </View>
                    <Text style={styles.trendValue}>{formatRupiah(point.total)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Penghasilan</Text>
            <View style={styles.selectedRangeRow}>
              <Badge tone="warning">
                {from === to ? formatTanggal(from, 'dash') : `${formatTanggal(from, 'dash')} s/d ${formatTanggal(to, 'dash')}`}
              </Badge>
            </View>
            {earnings ? (
              <View style={styles.statGrid}>
                <StatCard label="Hari Bekerja/Jualan" value={`${earnings.daysWorked} hari`} />
                <StatCard label="Total Gaji Harian" value={formatRupiah(earnings.totalTierSalary)} />
                <StatCard label="Total Komisi" value={formatRupiah(earnings.totalCommission)} />
                <StatCard label="Minus Setoran" value={`-${formatRupiah(earnings.totalMinusSetoran)}`} variant="danger" />
                <StatCard label="Pinjaman" value={`-${formatRupiah(earnings.totalPinjaman)}`} variant="danger" />
                <StatCard label="Total Penghasilan" value={formatRupiah(earnings.totalPenghasilan)} variant="success" />
              </View>
            ) : (
              <Text style={styles.emptyText}>Gagal memuat data penghasilan.</Text>
            )}
          </View>
        </>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  locationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9ca3af' },
  locationDotActive: { backgroundColor: '#16a34a' },
  locationTextWrap: { flex: 1 },
  locationTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  locationStatus: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  presetButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  presetButtonActive: { backgroundColor: '#111827', borderColor: '#111827' },
  presetText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  presetTextActive: { color: '#fff' },
  section: { marginBottom: 24 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  selectedRangeRow: { marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 12 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stockTable: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' },
  stockRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  stockHeaderRow: { backgroundColor: '#f9fafb' },
  stockCell: { flex: 1, fontSize: 13, color: '#111827', textAlign: 'right' },
  stockCellProduct: { flex: 2, textAlign: 'left' },
  stockHeaderText: { fontWeight: '700', color: '#6b7280' },
  skeletonLine: { height: 13, width: '70%' },
  skeletonLineRight: { alignSelf: 'flex-end' },
  trendChart: { gap: 10 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trendDate: { width: 68, fontSize: 11, color: '#6b7280' },
  trendBarTrack: { flex: 1, height: 10, backgroundColor: '#f3f4f6', borderRadius: 6, overflow: 'hidden' },
  trendBarFill: { height: '100%', backgroundColor: '#e63946', borderRadius: 6 },
  trendValue: { width: 90, fontSize: 11, color: '#111827', textAlign: 'right' },
});

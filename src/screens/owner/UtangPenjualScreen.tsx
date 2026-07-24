import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import api from '../../services/api';
import { formatRupiah, formatTanggal } from '../../utils/format';
import Badge from '../../components/Badge';
import AppNavbar from '../../components/AppNavbar';
import { SkeletonBlock } from '../../components/Skeleton';
import type { SellerDebt, SellerDebtSource } from '../../types/sellerDebt';

// Mirror frontend/src/pages/admin/SellerDebtsPage.tsx — versi READ-ONLY (aksi "Bayar"/
// "Catat Pinjaman" tetap admin-only lewat web, role owner di app ini cuma lihat).
const SOURCE_LABEL: Record<SellerDebtSource, string> = {
  kekurangan_setoran: 'Kekurangan Setoran',
  pinjaman: 'Pinjaman',
};

type StatusFilter = '' | 'belum_lunas' | 'lunas';

export default function UtangPenjualScreen() {
  const [status, setStatus] = useState<StatusFilter>('');
  const [debts, setDebts] = useState<SellerDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(false);
    api
      .get<SellerDebt[]>('/api/seller-debts', { params: status ? { status } : {} })
      .then(({ data }) => setDebts(data))
      .catch(() => setError(true))
      .finally(() => (isRefresh ? setRefreshing(false) : setLoading(false)));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <View style={styles.screen}>
      <AppNavbar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Utang Penjual</Text>
          <Text style={styles.subtitle}>Kekurangan setoran otomatis & pinjaman/kasbon manual.</Text>
        </View>

        <View style={styles.presetRow}>
          {([
            { value: '' as StatusFilter, label: 'Semua' },
            { value: 'belum_lunas' as StatusFilter, label: 'Belum Lunas' },
            { value: 'lunas' as StatusFilter, label: 'Lunas' },
          ]).map((f) => (
            <Pressable
              key={f.label}
              onPress={() => setStatus(f.value)}
              style={[styles.presetButton, status === f.value && styles.presetButtonActive]}
            >
              <Text style={[styles.presetText, status === f.value && styles.presetTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <>
            <SkeletonBlock style={styles.skeletonCard} />
            <SkeletonBlock style={styles.skeletonCard} />
            <SkeletonBlock style={styles.skeletonCard} />
          </>
        ) : error ? (
          <View>
            <Text style={styles.errorText}>Gagal memuat data.</Text>
            <Pressable onPress={() => load()} style={styles.retryButton}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : debts.length === 0 ? (
          <Text style={styles.emptyText}>Tidak ada utang penjual untuk filter ini.</Text>
        ) : (
          debts.map((d) => (
            <View key={d.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.sellerName}>{d.sellerName}</Text>
                <Badge tone={d.status === 'lunas' ? 'success' : 'danger'}>
                  {d.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                </Badge>
              </View>
              <Text style={styles.sourceLabel}>
                {SOURCE_LABEL[d.source]} • {formatTanggal(d.debtDate, 'pendek')}
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Utang</Text>
                  <Text style={styles.statValue}>{formatRupiah(d.totalAmount)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Terbayar</Text>
                  <Text style={styles.statValue}>{formatRupiah(d.amountPaid)}</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Sisa</Text>
                  <Text style={styles.statValueDanger}>{formatRupiah(d.outstanding)}</Text>
                </View>
              </View>
              {d.status === 'lunas' && d.paidOffDate && (
                <Text style={styles.paidOffText}>Lunas pada {formatTanggal(d.paidOffDate, 'pendek')}</Text>
              )}
            </View>
          ))
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
  presetRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
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
  emptyText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 12 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  skeletonCard: { height: 100, borderRadius: 10, marginBottom: 10 },
  card: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sellerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  sourceLabel: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statLabel: { fontSize: 11, color: '#6b7280' },
  statValue: { fontSize: 13, color: '#111827', fontWeight: '600', marginTop: 1 },
  statValueDanger: { fontSize: 13, color: '#dc2626', fontWeight: '600', marginTop: 1 },
  paidOffText: { fontSize: 11, color: '#15803d', marginTop: 8 },
});

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import api from '../../services/api';
import { formatRupiah, formatTanggal } from '../../utils/format';
import Badge from '../../components/Badge';
import { SkeletonBlock } from '../../components/Skeleton';
import type { Receivable } from '../../types/receivable';

// Mirror frontend/src/pages/admin/ReceivablesPage.tsx — versi READ-ONLY (aksi "Bayar"
// tetap admin-only lewat web, role owner di app ini cuma lihat). Sama pola dengan
// UtangPenjualScreen, cuma beda subjek (piutang customer, bukan utang penjual).
type StatusFilter = '' | 'dp' | 'lunas';

export default function PiutangScreen() {
  const [status, setStatus] = useState<StatusFilter>('');
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(false);
    api
      .get<Receivable[]>('/api/receivables', { params: status ? { status } : {} })
      .then(({ data }) => setReceivables(data))
      .catch(() => setError(true))
      .finally(() => (isRefresh ? setRefreshing(false) : setLoading(false)));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const isOverdue = (r: Receivable) => r.status !== 'lunas' && r.dueDate !== null && new Date(r.dueDate) < new Date();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={styles.presetRow}>
        {([
          { value: '' as StatusFilter, label: 'Semua' },
          { value: 'dp' as StatusFilter, label: 'Belum Lunas' },
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
      ) : receivables.length === 0 ? (
        <Text style={styles.emptyText}>Tidak ada piutang untuk filter ini.</Text>
      ) : (
        receivables.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.customerName}>{r.customerName || r.customName}</Text>
              <Badge tone={r.status === 'lunas' ? 'success' : isOverdue(r) ? 'danger' : 'warning'}>
                {r.status === 'lunas' ? 'Lunas' : isOverdue(r) ? 'Lewat Jatuh Tempo' : 'Belum Lunas'}
              </Badge>
            </View>
            <Text style={styles.dueDateLabel}>
              {r.dueDate ? `Jatuh tempo ${formatTanggal(r.dueDate, 'pendek')}` : 'Tanpa jatuh tempo'}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statValue}>{formatRupiah(r.totalAmount)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Terbayar</Text>
                <Text style={styles.statValue}>{formatRupiah(r.amountPaid)}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Sisa</Text>
                <Text style={styles.statValueDanger}>{formatRupiah(r.outstanding)}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
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
  customerName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  dueDateLabel: { fontSize: 12, color: '#6b7280', marginBottom: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1 },
  statLabel: { fontSize: 11, color: '#6b7280' },
  statValue: { fontSize: 13, color: '#111827', fontWeight: '600', marginTop: 1 },
  statValueDanger: { fontSize: 13, color: '#dc2626', fontWeight: '600', marginTop: 1 },
});

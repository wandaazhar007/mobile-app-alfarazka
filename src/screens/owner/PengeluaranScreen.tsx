import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import api from '../../services/api';
import { formatRupiah, formatTanggal } from '../../utils/format';
import todayJakarta from '../../utils/todayJakarta';
import StatCard from '../../components/StatCard';
import { SkeletonBlock, SkeletonStatCardRow } from '../../components/Skeleton';
import type { Expense } from '../../types/expense';

// Versi khusus (bukan cuma ringkasan seperti di OwnerDashboardScreen) — daftar
// pengeluaran lengkap per tanggal, sama pola rentang preset dengan LaporanScreen.
type RangePreset = 'today' | '7d' | '30d';

function daysAgoJakarta(days: number): string {
  const [y, m, d] = todayJakarta().split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function presetToRange(preset: RangePreset): { from: string; to: string } {
  const to = todayJakarta();
  if (preset === 'today') return { from: to, to };
  if (preset === '7d') return { from: daysAgoJakarta(6), to };
  return { from: daysAgoJakarta(29), to };
}

export default function PengeluaranScreen() {
  const [preset, setPreset] = useState<RangePreset>('today');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const { from, to } = presetToRange(preset);

  const load = useCallback(
    (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(false);
      api
        .get<Expense[]>('/api/expenses', { params: { from, to } })
        .then(({ data }) => setExpenses(data))
        .catch(() => setError(true))
        .finally(() => (isRefresh ? setRefreshing(false) : setLoading(false)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [from, to]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
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
          <SkeletonStatCardRow count={1} />
          <SkeletonBlock style={styles.skeletonList} />
        </>
      ) : error ? (
        <View>
          <Text style={styles.errorText}>Gagal memuat data.</Text>
          <Pressable onPress={() => load()} style={styles.retryButton}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.statGrid}>
            <StatCard label="Total Pengeluaran" value={formatRupiah(totalAmount)} variant="highlight" />
          </View>

          <View style={styles.section}>
            {expenses.length === 0 ? (
              <Text style={styles.emptyText}>Tidak ada pengeluaran pada rentang ini.</Text>
            ) : (
              expenses.map((e) => (
                <View key={e.id} style={styles.expenseRow}>
                  <View style={styles.expenseInfo}>
                    <Text style={styles.expenseCategory}>{e.categoryName}</Text>
                    {e.description && <Text style={styles.expenseDesc}>{e.description}</Text>}
                    <Text style={styles.expenseDate}>{formatTanggal(e.expenseDate, 'pendek')}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatRupiah(e.amount)}</Text>
                </View>
              ))
            )}
          </View>
        </>
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
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  emptyText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 12 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  skeletonList: { height: 200, borderRadius: 10, marginTop: 12 },
  section: { marginTop: 16 },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseInfo: { flex: 1, paddingRight: 12 },
  expenseCategory: { fontSize: 13, fontWeight: '600', color: '#111827' },
  expenseDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  expenseDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  expenseAmount: { fontSize: 13, fontWeight: '700', color: '#111827' },
});

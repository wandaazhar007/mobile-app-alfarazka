import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatRupiah, formatTanggal } from '../../utils/format';
import todayJakarta from '../../utils/todayJakarta';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import AppNavbar from '../../components/AppNavbar';
import { SkeletonBlock, SkeletonStatCardRow, SkeletonBadge } from '../../components/Skeleton';
import type { DashboardStackParamList } from '../../navigation/DashboardStack';
import type { DailyReport, SellerReportRow } from '../../types/dailyReport';
import type { RangeTotals } from '../../types/dailyClosing';
import type { Expense } from '../../types/expense';

const QUICK_LINKS = [
  { key: 'StokPagi' as const, label: 'Stok Pagi', icon: 'cube-outline' as const },
  { key: 'Pengeluaran' as const, label: 'Pengeluaran', icon: 'receipt-outline' as const },
  { key: 'Piutang' as const, label: 'Piutang', icon: 'document-text-outline' as const },
];

function daysAgoJakarta(days: number): string {
  const [y, m, d] = todayJakarta().split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

// Sama pola dengan preset Dashboard Penjual — mirror frontend/src/pages/owner/OwnerDashboard.tsx
// (ringkasan penjualan + pengeluaran + laba, gabungan keliling/toko/paket), tanpa chart
// (Recharts tidak dipakai di RN, cukup StatCard + tabel keliling + list pengeluaran).
type RangePreset = 'today' | '7d' | '30d';

function presetToRange(preset: RangePreset): { from: string; to: string } {
  const to = todayJakarta();
  if (preset === 'today') return { from: to, to };
  if (preset === '7d') return { from: daysAgoJakarta(6), to };
  return { from: daysAgoJakarta(29), to };
}

export default function OwnerDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>>();
  const [preset, setPreset] = useState<RangePreset>('today');
  const [report, setReport] = useState<DailyReport | null>(null);
  const [closing, setClosing] = useState<RangeTotals | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const { from, to } = presetToRange(preset);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(false);
      try {
        const [reportRes, closingRes, expensesRes] = await Promise.all([
          api.get<DailyReport>('/api/reports/daily', { params: { from, to } }),
          api.get<RangeTotals>('/api/daily-closings/range-totals', { params: { from, to } }),
          api.get<Expense[]>('/api/expenses', { params: { from, to } }),
        ]);
        setReport(reportRes.data);
        setClosing(closingRes.data);
        setExpenses(expensesRes.data);
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

  const kelilingColumns = ['Penjual', 'Cash', 'QRIS', 'Total', 'Terjual', 'Retur'];

  const renderSellerRow = (r: SellerReportRow) => (
    <View key={r.sellerId} style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.tableCellName]}>{r.sellerName}</Text>
      <Text style={styles.tableCell}>{formatRupiah(r.cash)}</Text>
      <Text style={styles.tableCell}>{formatRupiah(r.qris)}</Text>
      <Text style={styles.tableCell}>{formatRupiah(r.totalPenjualan)}</Text>
      <Text style={styles.tableCell}>{r.qtySold}</Text>
      <Text style={styles.tableCell}>{r.qtyReturned}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppNavbar />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Ringkasan penjualan, pengeluaran, dan laba gabungan.</Text>
        </View>

        <View style={styles.quickLinksRow}>
          {QUICK_LINKS.map((link) => (
            <Pressable key={link.key} style={styles.quickLinkCard} onPress={() => navigation.navigate(link.key)}>
              <Ionicons name={link.icon} size={20} color="#e63946" />
              <Text style={styles.quickLinkLabel}>{link.label}</Text>
            </Pressable>
          ))}
        </View>

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
            <View style={styles.selectedRangeRow}>
              <SkeletonBadge width={110} />
            </View>
            <SkeletonStatCardRow count={8} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Keliling — Penjualan per Penjual</Text>
              <SkeletonBlock style={styles.skeletonTable} />
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pengeluaran</Text>
              <SkeletonBlock style={styles.skeletonTable} />
            </View>
          </>
        ) : error || !report ? (
          <View style={styles.section}>
            <Text style={styles.errorText}>Gagal memuat data.</Text>
            <Pressable onPress={() => load()} style={styles.retryButton}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.selectedRangeRow}>
              <Badge tone="success">
                {from === to ? formatTanggal(from, 'dash') : `${formatTanggal(from, 'dash')} s/d ${formatTanggal(to, 'dash')}`}
              </Badge>
            </View>

            <View style={styles.statGrid}>
              <StatCard label="Total Penjualan" value={formatRupiah(report.summary.totalPenjualan)} variant="highlight" />
              <StatCard label="Total Cash" value={formatRupiah(report.summary.totalCash)} />
              <StatCard label="Total QRIS" value={formatRupiah(report.summary.totalQris)} />
              <StatCard label="Roti Terjual" value={String(report.summary.totalQtySold)} />
              <StatCard label="Total HPP" value={closing ? formatRupiah(closing.totalCogs) : '-'} />
              <StatCard label="Laba Kotor" value={closing ? formatRupiah(closing.grossProfit) : '-'} />
              <StatCard label="Pengeluaran Operasional" value={closing ? formatRupiah(closing.totalExpenses) : '-'} />
              <StatCard label="Laba Bersih" value={closing ? formatRupiah(closing.netProfit) : '-'} variant="success" />
            </View>

            <View style={styles.statGrid}>
              <StatCard label="Penjualan Keliling" value={formatRupiah(report.summary.totalKeliling)} />
              <StatCard label="Penjualan Toko" value={formatRupiah(report.summary.totalToko)} />
              <StatCard label="Penjualan Paket" value={formatRupiah(report.summary.totalPaket)} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Keliling — Penjualan per Penjual</Text>
              {report.keliling.sellers.length === 0 ? (
                <Text style={styles.emptyText}>Belum ada penjualan keliling pada rentang ini.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                      {kelilingColumns.map((c) => (
                        <Text key={c} style={[styles.tableCell, styles.tableHeaderText, c === 'Penjual' && styles.tableCellName]}>
                          {c}
                        </Text>
                      ))}
                    </View>
                    {report.keliling.sellers.map(renderSellerRow)}
                  </View>
                </ScrollView>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pengeluaran</Text>
              {expenses.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada pengeluaran pada rentang ini.</Text>
              ) : (
                expenses.map((e) => (
                  <View key={e.id} style={styles.expenseRow}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseCategory}>{e.categoryName}</Text>
                      {e.description && <Text style={styles.expenseDesc}>{e.description}</Text>}
                    </View>
                    <Text style={styles.expenseAmount}>{formatRupiah(e.amount)}</Text>
                  </View>
                ))
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
  quickLinksRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  quickLinkCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 12,
  },
  quickLinkLabel: { fontSize: 11, fontWeight: '600', color: '#374151' },
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
  selectedRangeRow: { marginBottom: 12 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 12 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  skeletonTable: { height: 140, borderRadius: 10 },
  table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  tableHeaderRow: { backgroundColor: '#f9fafb' },
  tableCell: { width: 90, fontSize: 12, color: '#111827', textAlign: 'right' },
  tableCellName: { width: 100, textAlign: 'left' },
  tableHeaderText: { fontWeight: '700', color: '#6b7280' },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  expenseInfo: { flex: 1, paddingRight: 8 },
  expenseCategory: { fontSize: 13, fontWeight: '600', color: '#111827' },
  expenseDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  expenseAmount: { fontSize: 13, color: '#111827', fontWeight: '600' },
});

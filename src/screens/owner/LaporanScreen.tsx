import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import api from '../../services/api';
import { formatRupiah, formatTanggal } from '../../utils/format';
import todayJakarta from '../../utils/todayJakarta';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import AppNavbar from '../../components/AppNavbar';
import { SkeletonBlock, SkeletonStatCardRow, SkeletonBadge } from '../../components/Skeleton';
import type { DailyReport, SellerReportRow } from '../../types/dailyReport';

// Mirror frontend/src/pages/reports/DailyReportPage.tsx — laporan gabungan
// keliling+toko+paket, reuse endpoint yang sama. Toko/Paket disederhanakan jadi
// list ringkas (bukan tabel lebar) supaya nyaman dibaca di layar HP.
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

export default function LaporanScreen() {
  const [preset, setPreset] = useState<RangePreset>('today');
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const { from, to } = presetToRange(preset);

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(false);
      try {
        const { data } = await api.get<DailyReport>('/api/reports/daily', { params: { from, to } });
        setReport(data);
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

  const renderSellerRow = (r: SellerReportRow) => (
    <View key={r.sellerId} style={styles.sellerCard}>
      <Text style={styles.sellerName}>{r.sellerName}</Text>
      <View style={styles.sellerStatsRow}>
        <View style={styles.sellerStat}>
          <Text style={styles.sellerStatLabel}>Cash</Text>
          <Text style={styles.sellerStatValue}>{formatRupiah(r.cash)}</Text>
        </View>
        <View style={styles.sellerStat}>
          <Text style={styles.sellerStatLabel}>QRIS</Text>
          <Text style={styles.sellerStatValue}>{formatRupiah(r.qris)}</Text>
        </View>
        <View style={styles.sellerStat}>
          <Text style={styles.sellerStatLabel}>Total</Text>
          <Text style={styles.sellerStatValue}>{formatRupiah(r.totalPenjualan)}</Text>
        </View>
      </View>
      <View style={styles.sellerStatsRow}>
        <View style={styles.sellerStat}>
          <Text style={styles.sellerStatLabel}>Minus</Text>
          <Text style={styles.sellerStatValueDanger}>-{formatRupiah(r.minus)}</Text>
        </View>
        <View style={styles.sellerStat}>
          <Text style={styles.sellerStatLabel}>Pinjaman</Text>
          <Text style={styles.sellerStatValueDanger}>-{formatRupiah(r.pinjaman)}</Text>
        </View>
        <View style={styles.sellerStat}>
          <Text style={styles.sellerStatLabel}>Roti Terjual/Retur</Text>
          <Text style={styles.sellerStatValue}>
            {r.qtySold}/{r.qtyReturned}
          </Text>
        </View>
      </View>
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
          <Text style={styles.title}>Laporan</Text>
          <Text style={styles.subtitle}>Laporan harian gabungan: keliling + toko + paket.</Text>
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
            <SkeletonStatCardRow count={3} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Keliling — Penjualan per Penjual</Text>
              <SkeletonBlock style={styles.skeletonCard} />
              <SkeletonBlock style={styles.skeletonCard} />
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
              <StatCard label="Total Cash" value={formatRupiah(report.summary.totalCash)} />
              <StatCard label="Total QRIS" value={formatRupiah(report.summary.totalQris)} />
              <StatCard label="Total Penjualan" value={formatRupiah(report.summary.totalPenjualan)} variant="highlight" />
            </View>
            <View style={styles.statGrid}>
              <StatCard label="Penjualan Keliling" value={formatRupiah(report.summary.totalKeliling)} />
              <StatCard label="Penjualan Toko" value={formatRupiah(report.summary.totalToko)} />
              <StatCard label="Penjualan Paket" value={formatRupiah(report.summary.totalPaket)} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Keliling — Penjualan per Penjual</Text>
              {report.keliling.sellers.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada data penjualan keliling.</Text>
              ) : (
                report.keliling.sellers.map(renderSellerRow)
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Toko — Transaksi Mini POS ({report.toko.summary.transactionCount})</Text>
              {report.toko.sales.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada transaksi toko.</Text>
              ) : (
                report.toko.sales.map((s) => (
                  <View key={s.id} style={styles.simpleRow}>
                    <Text style={styles.simpleRowItems} numberOfLines={1}>
                      {s.items.map((i) => `${i.productName} x${i.qty}`).join(', ') || '-'}
                    </Text>
                    <Text style={styles.simpleRowValue}>{formatRupiah(s.cash + s.qris)}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Paket — Penjualan Custom ({report.paket.summary.transactionCount})</Text>
              {report.paket.summary.outstanding > 0 && (
                <Text style={styles.hint}>Outstanding piutang paket: {formatRupiah(report.paket.summary.outstanding)}</Text>
              )}
              {report.paket.sales.length === 0 ? (
                <Text style={styles.emptyText}>Tidak ada transaksi paket.</Text>
              ) : (
                report.paket.sales.map((s) => (
                  <View key={s.id} style={styles.simpleRow}>
                    <View style={styles.simpleRowInfo}>
                      <Text style={styles.simpleRowItems}>{s.customName ?? '-'}</Text>
                      <Text style={styles.simpleRowSub}>{s.customerName ?? '-'} • {s.paymentStatus}</Text>
                    </View>
                    <Text style={styles.simpleRowValue}>{formatRupiah(s.totalAmount)}</Text>
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
  hint: { fontSize: 12, color: '#92400e', marginBottom: 10 },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 12 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  skeletonCard: { height: 90, borderRadius: 10, marginBottom: 10 },
  sellerCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  sellerName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  sellerStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sellerStat: { flex: 1 },
  sellerStatLabel: { fontSize: 11, color: '#6b7280' },
  sellerStatValue: { fontSize: 13, color: '#111827', fontWeight: '600', marginTop: 1 },
  sellerStatValueDanger: { fontSize: 13, color: '#dc2626', fontWeight: '600', marginTop: 1 },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 8,
  },
  simpleRowInfo: { flex: 1 },
  simpleRowItems: { flex: 1, fontSize: 13, color: '#111827' },
  simpleRowSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  simpleRowValue: { fontSize: 13, color: '#111827', fontWeight: '600' },
});

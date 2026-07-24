import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatRupiah, formatTanggal } from '../../utils/format';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import AppNavbar from '../../components/AppNavbar';
import SellerPickerModal from '../../components/SellerPickerModal';
import { SkeletonBlock, SkeletonStatCardRow } from '../../components/Skeleton';
import type { Seller } from '../../types/seller';
import type { PayrollPreview, PayrollClosing } from '../../types/sellerPayroll';

// Mirror frontend/src/pages/admin/SellerPayrollPage.tsx — versi READ-ONLY (role owner
// di app ini cuma lihat laporan, generate/konfirmasi bayar tetap admin-only lewat web).
function currentPeriodMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function shiftPeriodMonth(periodMonth: string, delta: number): string {
  const [y, m] = periodMonth.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function formatPeriodMonth(periodMonth: string): string {
  const [year, month] = periodMonth.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );
}

export default function GajiPenjualScreen() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerId, setSellerId] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [periodMonth, setPeriodMonth] = useState(currentPeriodMonth());

  const [preview, setPreview] = useState<PayrollPreview | null>(null);
  const [existingClosing, setExistingClosing] = useState<PayrollClosing | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [history, setHistory] = useState<PayrollClosing[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api
      .get<Seller[]>('/api/sellers')
      .then(({ data }) => setSellers(data.filter((s) => s.isActive)))
      .catch(() => setSellers([]));
  }, []);

  useEffect(() => {
    if (!sellerId) {
      setPreview(null);
      return;
    }
    setLoadingPreview(true);
    Promise.all([
      api.get<PayrollPreview>('/api/seller-payroll/preview', { params: { sellerId, periodMonth } }),
      api.get<PayrollClosing[]>('/api/seller-payroll', { params: { seller_id: sellerId } }),
    ])
      .then(([previewRes, closingsRes]) => {
        setPreview(previewRes.data);
        setExistingClosing(closingsRes.data.find((c) => c.periodMonth.startsWith(periodMonth)) ?? null);
      })
      .catch(() => setPreview(null))
      .finally(() => setLoadingPreview(false));
  }, [sellerId, periodMonth]);

  useEffect(() => {
    setLoadingHistory(true);
    api
      .get<PayrollClosing[]>('/api/seller-payroll', { params: sellerId ? { seller_id: sellerId } : {} })
      .then(({ data }) => setHistory(data))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [sellerId]);

  const selectedSellerName = sellers.find((s) => s.id === sellerId)?.name ?? 'Pilih penjual...';

  return (
    <View style={styles.screen}>
      <AppNavbar />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Gaji Penjual</Text>
          <Text style={styles.subtitle}>Gaji tier harian + komisi, dipotong utang yang belum lunas.</Text>
        </View>

        <View style={styles.filterRow}>
          <Pressable style={styles.pickerButton} onPress={() => setPickerVisible(true)}>
            <Text style={styles.pickerButtonText} numberOfLines={1}>
              {selectedSellerName}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </Pressable>

          <View style={styles.monthPicker}>
            <Pressable style={styles.monthArrow} onPress={() => setPeriodMonth((p) => shiftPeriodMonth(p, -1))} hitSlop={8}>
              <Ionicons name="chevron-back" size={18} color="#374151" />
            </Pressable>
            <Text style={styles.monthLabel}>{formatPeriodMonth(periodMonth)}</Text>
            <Pressable style={styles.monthArrow} onPress={() => setPeriodMonth((p) => shiftPeriodMonth(p, 1))} hitSlop={8}>
              <Ionicons name="chevron-forward" size={18} color="#374151" />
            </Pressable>
          </View>
        </View>

        {!sellerId ? (
          <Text style={styles.emptyText}>Pilih penjual dulu untuk melihat preview gaji bulanan.</Text>
        ) : loadingPreview ? (
          <SkeletonStatCardRow count={4} />
        ) : preview ? (
          <>
            <View style={styles.previewHeader}>
              <Badge tone="success">{formatPeriodMonth(periodMonth)}</Badge>
              {existingClosing?.status === 'paid' && <Badge tone="success">Sudah Dibayar</Badge>}
              {existingClosing?.status === 'draft' && <Badge tone="warning">Draft — belum dibayar</Badge>}
            </View>
            <View style={styles.statGrid}>
              <StatCard label="Hari Bekerja/Jualan" value={`${preview.daysWorked} hari`} />
              <StatCard label="Produk Terjual" value={`${preview.totalRotiQty} pcs`} />
              <StatCard label="Produk Komisi Terjual" value={`${preview.totalCommissionQty} pcs`} />
            </View>
            <View style={styles.statGrid}>
              <StatCard label="Total Gaji Harian" value={formatRupiah(preview.totalTierSalary)} />
              <StatCard label="Total Komisi" value={formatRupiah(preview.totalCommission)} />
              <StatCard label="Utang Belum Lunas" value={formatRupiah(preview.outstandingDebt)} />
              <StatCard label="Diusulkan Dipotong" value={formatRupiah(preview.debtDeduction)} />
              <StatCard label="Net Payout" value={formatRupiah(preview.netPayout)} variant="highlight" />
            </View>
            {preview.unsettledDate && (
              <Badge tone="danger">
                {`${selectedSellerName} belum melakukan setoran pada tanggal ${formatTanggal(preview.unsettledDate, 'pendek')}`}
              </Badge>
            )}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Riwayat Gaji Bulanan</Text>
        {loadingHistory ? (
          <>
            <SkeletonBlock style={styles.skeletonRow} />
            <SkeletonBlock style={styles.skeletonRow} />
          </>
        ) : history.length === 0 ? (
          <Text style={styles.emptyText}>Belum ada riwayat gaji bulanan.</Text>
        ) : (
          history.map((c) => (
            <View key={c.id} style={styles.historyCard}>
              <View style={styles.historyHeaderRow}>
                <Text style={styles.historySeller}>{c.sellerName}</Text>
                <Badge tone={c.status === 'paid' ? 'success' : 'warning'}>
                  {c.status === 'paid' ? 'Sudah Dibayar' : 'Draft'}
                </Badge>
              </View>
              <Text style={styles.historyPeriod}>{formatPeriodMonth(c.periodMonth)}</Text>
              <View style={styles.historyStatsRow}>
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatLabel}>Gaji Tier</Text>
                  <Text style={styles.historyStatValue}>{formatRupiah(c.totalTierSalary)}</Text>
                </View>
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatLabel}>Komisi</Text>
                  <Text style={styles.historyStatValue}>{formatRupiah(c.totalCommission)}</Text>
                </View>
                <View style={styles.historyStat}>
                  <Text style={styles.historyStatLabel}>Net Payout</Text>
                  <Text style={styles.historyStatValue}>{formatRupiah(c.netPayout)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <SellerPickerModal
        visible={pickerVisible}
        sellers={sellers}
        selectedId={sellerId}
        onSelect={setSellerId}
        onClose={() => setPickerVisible(false)}
      />
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
  filterRow: { gap: 10, marginBottom: 16 },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  pickerButtonText: { fontSize: 14, color: '#111827', flex: 1 },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  monthArrow: { padding: 6 },
  monthLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },
  previewHeader: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  emptyText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 12 },
  skeletonRow: { height: 90, borderRadius: 10, marginBottom: 10 },
  historyCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 10 },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historySeller: { fontSize: 14, fontWeight: '700', color: '#111827' },
  historyPeriod: { fontSize: 12, color: '#6b7280', marginBottom: 8 },
  historyStatsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  historyStat: { flex: 1 },
  historyStatLabel: { fontSize: 11, color: '#6b7280' },
  historyStatValue: { fontSize: 13, color: '#111827', fontWeight: '600', marginTop: 1 },
});

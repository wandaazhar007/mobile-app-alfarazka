import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { formatTanggal } from '../../utils/format';
import todayJakarta from '../../utils/todayJakarta';
import { SkeletonBlock } from '../../components/Skeleton';
import type { StockMovement } from '../../types/stockMovement';

// Beda dari LaporanScreen/PengeluaranScreen (rentang tanggal) — stock-movements di
// backend cuma bisa difilter SATU tanggal per request (lihat StockMovementService.
// listMovements), jadi di sini navigasinya per hari (prev/next), bukan preset rentang.
function shiftDateJakarta(date: string, deltaDays: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

export default function StokPagiScreen() {
  const [date, setDate] = useState(todayJakarta());
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(false);
      api
        .get<StockMovement[]>('/api/stock-movements', { params: { date } })
        .then(({ data }) => setMovements(data))
        .catch(() => setError(true))
        .finally(() => (isRefresh ? setRefreshing(false) : setLoading(false)));
    },
    [date]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const isToday = date === todayJakarta();
  const totalQtyOut = movements.reduce((sum, m) => sum + m.qtyOut, 0);
  const totalQtyReturned = movements.reduce((sum, m) => sum + m.qtyReturned, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={styles.dateStepper}>
        <Pressable style={styles.stepperButton} onPress={() => setDate((d) => shiftDateJakarta(d, -1))} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </Pressable>
        <Text style={styles.dateLabel}>{formatTanggal(date, 'dash')}</Text>
        <Pressable
          style={[styles.stepperButton, isToday && styles.stepperButtonDisabled]}
          onPress={() => !isToday && setDate((d) => shiftDateJakarta(d, 1))}
          disabled={isToday}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={20} color={isToday ? '#d1d5db' : '#111827'} />
        </Pressable>
      </View>

      {loading ? (
        <>
          <SkeletonBlock style={styles.skeletonList} />
        </>
      ) : error ? (
        <View>
          <Text style={styles.errorText}>Gagal memuat data.</Text>
          <Pressable onPress={() => load()} style={styles.retryButton}>
            <Text style={styles.retryText}>Coba Lagi</Text>
          </Pressable>
        </View>
      ) : movements.length === 0 ? (
        <Text style={styles.emptyText}>Belum ada stok pagi dicatat untuk tanggal ini.</Text>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Total keluar: <Text style={styles.summaryValue}>{totalQtyOut}</Text> · Retur:{' '}
              <Text style={styles.summaryValue}>{totalQtyReturned}</Text>
            </Text>
          </View>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCell, styles.tableHeaderText, styles.tableCellName]}>Penjual / Produk</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Keluar</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Retur</Text>
              <Text style={[styles.tableCell, styles.tableHeaderText]}>Terjual</Text>
            </View>
            {movements.map((m) => (
              <View key={m.id} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.tableCellName]}>
                  <Text style={styles.sellerName}>{m.sellerName}</Text>
                  <Text style={styles.productName}>{m.productName}</Text>
                </View>
                <Text style={styles.tableCell}>{m.qtyOut}</Text>
                <Text style={styles.tableCell}>{m.qtyReturned}</Text>
                <Text style={styles.tableCell}>{m.returnedAt ? m.qtySold : 0}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, paddingBottom: 40 },
  dateStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  stepperButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  stepperButtonDisabled: { opacity: 0.4 },
  dateLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  summaryRow: { marginBottom: 12 },
  summaryText: { fontSize: 13, color: '#6b7280' },
  summaryValue: { fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: 13, color: '#6b7280', fontStyle: 'italic' },
  errorText: { fontSize: 14, color: '#dc2626', marginBottom: 12 },
  retryButton: { alignSelf: 'flex-start', backgroundColor: '#111827', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  skeletonList: { height: 200, borderRadius: 10 },
  table: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableHeaderRow: { backgroundColor: '#f9fafb', borderBottomColor: '#e5e7eb' },
  tableCell: { flex: 1, fontSize: 12, color: '#111827', textAlign: 'center' },
  tableHeaderText: { fontWeight: '700', color: '#6b7280', fontSize: 11 },
  tableCellName: { flex: 2, textAlign: 'left' },
  sellerName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  productName: { fontSize: 11, color: '#6b7280', marginTop: 1 },
});

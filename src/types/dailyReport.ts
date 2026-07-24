// Mirror frontend/src/types/dailyReport.ts (cuma field yang dipakai mobile)
export interface SellerReportRow {
  sellerId: string;
  sellerName: string;
  cash: number;
  qris: number;
  minus: number;
  pinjaman: number;
  totalPenjualan: number;
  qtyOut: number;
  qtyReturned: number;
  qtySold: number;
  commissionQtyReturned: number;
  commissionQtySold: number;
}

export interface KelilingSummary {
  totalCash: number;
  totalQris: number;
  totalMinus: number;
  totalPinjaman: number;
  totalPenjualan: number;
  totalQtyOut: number;
  totalQtyReturned: number;
  totalQtySold: number;
  totalKomisiQtySold: number;
  totalKomisiQtyReturned: number;
}

export interface TokoSaleItemRow {
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface TokoSaleRow {
  id: string;
  totalAmount: number;
  cash: number;
  qris: number;
  items: TokoSaleItemRow[];
}

export interface TokoSummary {
  cash: number;
  qris: number;
  transactionCount: number;
}

export interface PaketSaleRow {
  id: string;
  customName: string | null;
  customerName: string | null;
  totalAmount: number;
  cash: number;
  qris: number;
  paymentStatus: string;
  outstanding: number;
}

export interface PaketSummary {
  cash: number;
  qris: number;
  totalNilaiPaket: number;
  outstanding: number;
  transactionCount: number;
}

export interface DailyReportSummary {
  totalCash: number;
  totalQris: number;
  totalPenjualan: number;
  totalKeliling: number;
  totalToko: number;
  totalPaket: number;
  totalQtyOut: number;
  totalQtyReturned: number;
  totalQtySold: number;
  totalKomisiQtySold: number;
}

export interface DailyReport {
  from?: string;
  to?: string;
  keliling: { sellers: SellerReportRow[]; summary: KelilingSummary };
  toko: { sales: TokoSaleRow[]; summary: TokoSummary };
  paket: { sales: PaketSaleRow[]; summary: PaketSummary };
  summary: DailyReportSummary;
}

// Mirror frontend/src/types/sellerDebt.ts
export type SellerDebtSource = 'kekurangan_setoran' | 'pinjaman';
export type SellerDebtStatus = 'belum_lunas' | 'lunas';

export interface SellerDebt {
  id: string;
  sellerId: string;
  sellerName: string;
  source: SellerDebtSource;
  debtDate: string;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  status: SellerDebtStatus;
  note: string | null;
  paidOffDate: string | null;
  createdAt: string;
}

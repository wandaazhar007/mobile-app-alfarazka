// Mirror frontend/src/types/receivable.ts (cuma field yang dipakai mobile)
export interface Receivable {
  id: string;
  customerName?: string;
  customName?: string | null;
  totalAmount: number;
  amountPaid: number;
  outstanding: number;
  dueDate: string | null;
  status: 'dp' | 'lunas';
}

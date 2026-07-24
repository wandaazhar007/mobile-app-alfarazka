// Mirror frontend/src/types/dailyClosing.ts (cuma RangeTotals, dipakai owner dashboard)
export interface RangeTotals {
  totalSalesCash: number;
  totalSalesQris: number;
  totalCogs: number;
  totalExpenses: number;
  grossProfit: number;
  netProfit: number;
  totalBreadSold: number;
  totalBreadReturned: number;
}

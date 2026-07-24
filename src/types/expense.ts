// Mirror frontend/src/types/expense.ts (cuma field yang dipakai mobile)
export interface Expense {
  id: string;
  categoryName: string;
  amount: number;
  description: string | null;
  expenseDate: string;
}

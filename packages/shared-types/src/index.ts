// Re-export Prisma types
export type {
  Account,
  Customer,
  CustomerType,
  Transaction,
  TransactionType,
  Order,
  OrderStatus,
  OrderItem,
  ExpenseCategory,
  MonthlySummary,
} from '@prisma/client';

// UI Types
export interface SelectOption {
  value: string;
  label: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T) => any;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Dashboard types
export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  orderCount: number;
  pendingOrders: number;
  completedOrders: number;
  previousPeriodIncome?: number;
  previousPeriodExpense?: number;
  previousPeriodProfit?: number;
}

export interface ChartDataPoint {
  date: string;
  income: number;
  expense: number;
  label?: string;
}

// Form types
export interface TransactionFormData {
  date: string;
  type: 'INCOME' | 'EXPENSE' | 'PROFIT' | 'COST';
  amount: string;
  description: string;
  category: string;
  accountId: string;
  customerId?: string;
  orderId?: string;
}

export interface OrderFormData {
  productName: string;
  unit: string;
  qty: number;
  supplierId?: string;
  purchaseDate: string;
  purchasePrice: number;
  customerId?: string;
  saleDate: string;
  salePrice: number;
  expectedDate: string;
  notes: string;
}

// Status helpers
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  BUYING: 'Đang mua',
  RECEIVED: 'Đã nhận hàng',
  SELLING: 'Đang bán',
  SOLD: 'Đã bán',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  BUYING: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-purple-100 text-purple-800',
  SELLING: 'bg-indigo-100 text-indigo-800',
  SOLD: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: 'Thu tiền',
  EXPENSE: 'Chi tiền',
  PROFIT: 'Lãi',
  COST: 'Giá vốn',
};

export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  INCOME: 'text-green-600',
  EXPENSE: 'text-red-600',
  PROFIT: 'text-blue-600',
  COST: 'text-orange-600',
};

/**
 * Client-side API actions using apiClient
 * Replaces server actions for use in Vite-based frontend
 */
import apiClient from './apiClient';

// ============================================
// CUSTOMERS
// ============================================
export const createCustomer = async (data: any) => {
  try {
    const res = await apiClient.post('/customers', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const updateCustomer = async (id: string, data: any) => {
  try {
    const res = await apiClient.put(`/customers/${id}`, data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    const res = await apiClient.delete(`/customers/${id}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const getCustomers = async () => {
  try {
    const res = await apiClient.get('/customers');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// USERS
// ============================================
export const createUser = async (data: any) => {
  try {
    const res = await apiClient.post('/users', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const updateUser = async (id: string, data: any) => {
  try {
    const res = await apiClient.put(`/users/${id}`, data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const deleteUser = async (id: string) => {
  try {
    const res = await apiClient.delete(`/users/${id}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const getUsers = async () => {
  try {
    const res = await apiClient.get('/users');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getRoles = async () => {
  try {
    const res = await apiClient.get('/roles');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// ORDERS
// ============================================
export const createOrder = async (data: any) => {
  try {
    const res = await apiClient.post('/orders', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const updateOrder = async (id: string, data: any) => {
  try {
    const res = await apiClient.put(`/orders/${id}`, data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const deleteOrder = async (id: string) => {
  try {
    const res = await apiClient.delete(`/orders/${id}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const getOrders = async () => {
  try {
    const res = await apiClient.get('/orders');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// PRODUCTS
// ============================================
export const createProduct = async (data: any) => {
  try {
    const res = await apiClient.post('/products', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const updateProduct = async (id: string, data: any) => {
  try {
    const res = await apiClient.put(`/products/${id}`, data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const res = await apiClient.delete(`/products/${id}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const getProducts = async () => {
  try {
    const res = await apiClient.get('/products');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// TRANSACTIONS
// ============================================
export const createTransaction = async (data: any) => {
  try {
    const res = await apiClient.post('/transactions', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const updateTransaction = async (id: string, data: any) => {
  try {
    const res = await apiClient.put(`/transactions/${id}`, data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const res = await apiClient.delete(`/transactions/${id}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const getTransactions = async () => {
  try {
    const res = await apiClient.get('/transactions');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// COMMISSIONS
// ============================================
export const createCommissionRule = async (data: any) => {
  try {
    const res = await apiClient.post('/commissions/rules', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const updateCommissionRule = async (id: string, data: any) => {
  try {
    const res = await apiClient.put(`/commissions/rules/${id}`, data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const deleteCommissionRule = async (id: string) => {
  try {
    const res = await apiClient.delete(`/commissions/rules/${id}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const calculatePayout = async (userId: string, month: number, year: number) => {
  try {
    const res = await apiClient.post(`/commissions/calculate`, { userId, month, year });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const markPayoutAsPaid = async (id: string) => {
  try {
    const res = await apiClient.post(`/commissions/payouts/${id}/mark-paid`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// ============================================
// EMPLOYEE TRANSACTIONS
// ============================================
export const createEmployeeTransaction = async (data: any) => {
  try {
    const res = await apiClient.post('/employee-transactions', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const updateEmployeeTransaction = async (id: string, data: any) => {
  try {
    const res = await apiClient.put(`/employee-transactions/${id}`, data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const deleteEmployeeTransaction = async (id: string) => {
  try {
    const res = await apiClient.delete(`/employee-transactions/${id}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const approveEmployeeTransaction = async (id: string, group: string, categoryId: string) => {
  try {
    const res = await apiClient.post(`/employee-transactions/${id}/approve`, { group, categoryId });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const rejectEmployeeTransaction = async (id: string) => {
  try {
    const res = await apiClient.post(`/employee-transactions/${id}/reject`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const approveMultipleEmployeeTransactions = async (ids: string[], group: string, categoryId: string) => {
  try {
    const res = await apiClient.post(`/employee-transactions/bulk-approve`, { ids, group, categoryId });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// ============================================
// REPORTS
// ============================================
export const getMonthlyReportData = async (year: number, month: number) => {
  try {
    const res = await apiClient.get(`/reports/monthly?year=${year}&month=${month}`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// RECONCILIATION
// ============================================
export const reconcileTransactionsWithOrders = async (transactionId: string, orderIds: string[]) => {
  try {
    const res = await apiClient.post('/reconciliation/reconcile', { transactionId, orderIds });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// ============================================
// DASHBOARD
// ============================================
export const getDashboardSummary = async () => {
  try {
    const res = await apiClient.get('/dashboard/summary');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// INVENTORY
// ============================================
export const importStock = async (data: any) => {
  try {
    const res = await apiClient.post('/inventory/import', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const adjustStock = async (productId: string, quantity: number, reason: string) => {
  try {
    const res = await apiClient.post('/inventory/adjust', { productId, quantity, reason });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const getInventoryHistory = async (productId: string) => {
  try {
    const res = await apiClient.get(`/inventory/${productId}/history`);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// ============================================
// TRANSACTION CATEGORIES
// ============================================
export const getTransactionCategories = async () => {
  try {
    const res = await apiClient.get('/transaction-categories');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const createTransactionCategory = async (data: any) => {
  try {
    const res = await apiClient.post('/transaction-categories', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// ============================================
// MIGRATION
// ============================================
export const importDataFromExcel = async (file: File, options: any) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    
    const res = await apiClient.post('/migration/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const getMigrationDependencies = async () => {
  try {
    const res = await apiClient.get('/migration/dependencies');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const importBulkTransactions = async (data: any[]) => {
  try {
    const res = await apiClient.post('/migration/transactions/bulk', { transactions: data });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const importBulkOrders = async (data: any[]) => {
  try {
    const res = await apiClient.post('/migration/orders/bulk', { orders: data });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const autoReconcileCashflow = async () => {
  try {
    const res = await apiClient.post('/migration/reconcile');
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

export const processDataMigration = async (data: any) => {
  try {
    const res = await apiClient.post('/migration/process', data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

// ============================================
// PRODUCT UNITS
// ============================================
export const addProductUnit = async (productId: string, data: any) => {
  try {
    const res = await apiClient.post(`/products/${productId}/units`, data);
    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

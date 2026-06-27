import apiClient from '@/lib/apiClient';
export const processDataMigration = async () => (await apiClient.post('/migration/process')).data;
export const getMigrationDependencies = async () => (await apiClient.get('/migration/dependencies')).data;
export const importBulkTransactions = async (data: any) => (await apiClient.post('/migration/transactions', data)).data;
export const importBulkOrders = async (data: any) => (await apiClient.post('/migration/orders', data)).data;
export const autoReconcileCashflow = async () => (await apiClient.post('/migration/reconcile')).data;
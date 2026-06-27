import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import React, { useState, useEffect, Suspense, lazy } from 'react';
import apiClient from './lib/apiClient';

// ============================================
// LAZY LOAD COMPONENTS
// ============================================
const DashboardClient = lazy(() => import('./components/dashboard/DashboardClient'));
const OrderListClient = lazy(() => import('./components/orders/OrderListClient'));
const ProductListClient = lazy(() => import('./components/products/ProductListClient'));
const TransactionListClient = lazy(() => import('./components/transactions/TransactionListClient'));
const CustomerListClient = lazy(() => import('./components/customers/CustomerListClient'));
const DebtListClient = lazy(() => import('./components/debts/DebtListClient'));
const ReportClient = lazy(() => import('./components/reports/ReportClient'));
const CommissionsClient = lazy(() => import('./components/commissions/CommissionsClient'));
const UserListClient = lazy(() => import('./components/users/UserListClient'));
const EmployeeCashflowClient = lazy(() => import('./components/employee-cashflow/EmployeeCashflowClient'));
const ReconciliationDashboard = lazy(() => import('./components/reconciliation/ReconciliationDashboard'));

// ============================================
// UTILITY COMPONENTS
// ============================================
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
  </div>
);

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
    <p className="font-medium">Lỗi</p>
    <p className="text-sm">{message}</p>
  </div>
);

// ============================================
// DATA FETCHING HOOKS
// ============================================
function useApiData<T>(fetchFn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    
    fetchFn()
      .then((result) => {
        if (mounted) {
          setData(result?.data || result || null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Lỗi khi tải dữ liệu');
          setLoading(false);
        }
      });

    return () => { mounted = false; };
  }, deps);

  return { data, loading, error };
}

// ============================================
// PAGE WRAPPER COMPONENTS
// ============================================

// Dashboard Page
function DashboardPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const res = await apiClient.get('/dashboard/summary');
      return res.data;
    } catch {
      return { summary: { totalIncome: 0, totalExpense: 0, profit: 0, orderCount: 0, accountBalances: [] }, chartData: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <DashboardClient 
      summary={data?.summary || { totalIncome: 0, totalExpense: 0, profit: 0, orderCount: 0, accountBalances: [] }} 
      chartData={data?.chartData || []} 
    />
  );
}

// Orders Page
function OrdersPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const [ordersRes, customersRes] = await Promise.all([
        apiClient.get('/orders'),
        apiClient.get('/customers')
      ]);
      return { orders: ordersRes.data?.data || ordersRes.data || [], customers: customersRes.data?.data || customersRes.data || [] };
    } catch {
      return { orders: [], customers: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <OrderListClient orders={data?.orders || []} customers={data?.customers || []} />;
}

// Products Page
function ProductsPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        apiClient.get('/products'),
        apiClient.get('/products/categories')
      ]);
      return { products: productsRes.data?.data || productsRes.data || [], categories: categoriesRes.data?.data || categoriesRes.data || [] };
    } catch {
      return { products: [], categories: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <ProductListClient products={data?.products || []} categories={data?.categories || []} />;
}

// Transactions Page
function TransactionsPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const [txRes, categoriesRes, accountsRes] = await Promise.all([
        apiClient.get('/transactions'),
        apiClient.get('/transaction-categories'),
        apiClient.get('/accounts')
      ]);
      return { 
        transactions: txRes.data?.data || txRes.data || [], 
        categories: categoriesRes.data?.data || categoriesRes.data || [],
        accounts: accountsRes.data?.data || accountsRes.data || []
      };
    } catch {
      return { transactions: [], categories: [], accounts: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <TransactionListClient 
    transactions={data?.transactions || []} 
    categories={data?.categories || []}
    accounts={data?.accounts || []}
  />;
}

// Customers Page
function CustomersPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const res = await apiClient.get('/customers');
      return { customers: res.data?.data || res.data || [] };
    } catch {
      return { customers: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <CustomerListClient customers={data?.customers || []} />;
}

// Debts Page
function DebtsPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const res = await apiClient.get('/customers/debts');
      return { debts: res.data?.data || res.data || [] };
    } catch {
      return { debts: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <DebtListClient initialData={data?.debts || []} />;
}

// Reports Page
function ReportsPage() {
  return <ReportClient />;
}

// Commissions Page
function CommissionsPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const [rulesRes, payoutsRes, usersRes] = await Promise.all([
        apiClient.get('/commissions/rules'),
        apiClient.get('/commissions/payouts'),
        apiClient.get('/users')
      ]);
      return { 
        rules: rulesRes.data?.data || rulesRes.data || [],
        payouts: payoutsRes.data?.data || payoutsRes.data || [],
        users: usersRes.data?.data || usersRes.data || []
      };
    } catch {
      return { rules: [], payouts: [], users: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <CommissionsClient 
    initialRules={data?.rules || []} 
    initialPayouts={data?.payouts || []} 
    users={data?.users || []}
    currentUser={{ id: '', role: 'ADMIN' }}
  />;
}

// Users Page
function UsersPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const res = await apiClient.get('/users');
      return { users: res.data?.data || res.data || [] };
    } catch {
      return { users: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <UserListClient initialData={data?.users || []} />;
}

// Employee Cashflow Page
function EmployeeCashflowPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const [txRes, categoriesRes] = await Promise.all([
        apiClient.get('/employee-transactions'),
        apiClient.get('/transaction-categories')
      ]);
      return { 
        transactions: txRes.data?.data || txRes.data || [],
        categories: categoriesRes.data?.data || categoriesRes.data || []
      };
    } catch {
      return { transactions: [], categories: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <EmployeeCashflowClient 
    initialData={data?.transactions || []}
    currentUser={{ id: '', role: 'ADMIN' }}
    transactionCategories={data?.categories || []}
  />;
}

// Reconciliation Page
function ReconciliationPage() {
  const { data, loading, error } = useApiData(async () => {
    try {
      const [orphanTxsRes, pendingOrdersRes] = await Promise.all([
        apiClient.get('/reconciliation/orphan-transactions'),
        apiClient.get('/reconciliation/pending-orders')
      ]);
      return { 
        transactions: data?.transactions || [],
        orders: data?.orders || []
      };
    } catch {
      return { transactions: [], orders: [] };
    }
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <ReconciliationDashboard transactions={[]} orders={[]} />;
}

// ============================================
// LAYOUT COMPONENT
// ============================================
function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Trang chủ', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/orders', label: 'Đơn hàng', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { path: '/products', label: 'Sản phẩm', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { path: '/transactions', label: 'Sổ quỹ', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { path: '/customers', label: 'Đối tác', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/debts', label: 'Công nợ', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/reports', label: 'Báo cáo', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { path: '/commissions', label: 'Hoa hồng', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/users', label: 'Nhân viên', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { path: '/employee-cashflow', label: 'Quỹ NV', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    { path: '/reconciliation', label: 'Đối soát', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ];

  const isActive = (path: string) => 
    location.pathname === path 
      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600 font-semibold' 
      : 'text-gray-700 hover:bg-gray-50';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-blue-700 tracking-tight">Việt Tùng ERP</h1>
          <p className="text-xs text-gray-500 mt-1">Quản lý bán hàng</p>
        </div>
        
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center px-6 py-3 font-medium transition-colors ${isActive(item.path)}`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm">
              A
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">admin@viettung.vn</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* Dashboard */}
          <Route path="/" element={<DashboardPage />} />
          
          {/* Core Modules */}
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/debts" element={<DebtsPage />} />
          
          {/* Reports & Analysis */}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/commissions" element={<CommissionsPage />} />
          
          {/* HR & Finance */}
          <Route path="/users" element={<UsersPage />} />
          <Route path="/employee-cashflow" element={<EmployeeCashflowPage />} />
          
          {/* Utilities */}
          <Route path="/reconciliation" element={<ReconciliationPage />} />
          
          {/* Fallback */}
          <Route path="*" element={<DashboardPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

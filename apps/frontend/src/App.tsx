import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import React, { Suspense } from 'react';

// Import components (Lazy load for better performance)
const DashboardClient = React.lazy(() => import('./components/dashboard/DashboardClient'));
const OrderListClient = React.lazy(() => import('./components/orders/OrderListClient'));
const ProductListClient = React.lazy(() => import('./components/products/ProductListClient'));
const TransactionListClient = React.lazy(() => import('./components/transactions/TransactionListClient'));

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-700 hover:bg-gray-50';

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-blue-700 tracking-tight">Việt Tùng ERP</h1>
        </div>
        <nav className="flex-1 py-4 space-y-1">
          <Link to="/" className={`block px-6 py-3 font-medium transition-colors ${isActive('/')}`}>Trang chủ</Link>
          <Link to="/orders" className={`block px-6 py-3 font-medium transition-colors ${isActive('/orders')}`}>Đơn hàng</Link>
          <Link to="/products" className={`block px-6 py-3 font-medium transition-colors ${isActive('/products')}`}>Sản phẩm</Link>
          <Link to="/transactions" className={`block px-6 py-3 font-medium transition-colors ${isActive('/transactions')}`}>Sổ quỹ</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

// Mock Data to prevent crashes
const DUMMY_DASHBOARD_SUMMARY = {
  totalIncome: 0,
  totalExpense: 0,
  profit: 0,
  orderCount: 0,
  accountBalances: []
};

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardClient summary={DUMMY_DASHBOARD_SUMMARY} chartData={[]} />} />
          <Route path="/orders" element={<OrderListClient orders={[]} customers={[]} />} />
          <Route path="/products" element={<ProductListClient products={[]} categories={[]} />} />
          <Route path="/transactions" element={<TransactionListClient transactions={[]} categories={[]} accounts={[]} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

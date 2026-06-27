import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">Việt Tùng ERP</h1>
        </div>
        <nav className="p-4 space-y-2">
          <Link to="/" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">Trang chủ</Link>
          <Link to="/orders" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">Đơn hàng</Link>
          <Link to="/products" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">Sản phẩm</Link>
          <Link to="/transactions" className="block p-2 text-gray-700 hover:bg-gray-100 rounded">Sổ quỹ</Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}

function Welcome() {
  return (
    <div className="bg-white p-8 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Chào mừng đến với Việt Tùng ERP (Vite React)</h2>
      <p className="text-gray-600 mb-4">Hệ thống đã được chuyển đổi thành công từ Next.js sang Vite.</p>
      <p className="text-gray-600">Các thành phần (Components) của bạn đã được thay thế Link/Router từ Next.js sang React Router. Tuy nhiên bạn cần kết nối chúng với API Backend (NestJS) thông qua các hooks như useEffect hoặc React Query.</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/orders" element={<div>Trang Đơn Hàng (Đang cập nhật)</div>} />
          <Route path="/products" element={<div>Trang Sản Phẩm (Đang cập nhật)</div>} />
          <Route path="/transactions" element={<div>Trang Sổ Quỹ (Đang cập nhật)</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

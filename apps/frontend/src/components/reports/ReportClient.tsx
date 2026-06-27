'use client';

import React, { useState, useEffect } from 'react';
import { getMonthlyReportData } from '@/app/actions/reports';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

export default function ReportClient() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getMonthlyReportData(year, month);
      if (res.success) {
        setReportData(res.data);
      } else {
        toast.error(res.error || 'Lỗi lấy dữ liệu');
      }
    } catch (err) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [year, month]);

  const handleExportExcel = async () => {
    if (!reportData) return;

    try {
      // Dynamic import to optimize bundle size
      const XLSX = await import('xlsx');

      // Sheet 1: Thu Chi
      const txData = reportData.transactions.map((tx: any, index: number) => ({
        'STT': index + 1,
        'Ngày': new Date(tx.date).toLocaleDateString('vi-VN'),
        'Loại': tx.type === 'INCOME' ? 'Thu' : 'Chi',
        'Số tiền': tx.amount,
        'Mô tả': tx.description || '',
        'Tài khoản': tx.account?.name || '',
      }));

      // Sheet 2: Đơn hàng
      const orderData = reportData.orders.map((o: any, index: number) => ({
        'STT': index + 1,
        'Mã đơn': o.orderCode,
        'Khách hàng': o.customer?.name || 'Khách lẻ',
        'Sản phẩm': o.items && o.items.length > 0 ? o.items[0].productName : '',
        'Tổng Mua': o.purchasePrice,
        'Tổng Bán': o.salePrice,
        'Lợi nhuận': o.profit,
        'Trạng thái': o.status,
      }));

      // Sheet 3: Quỹ nhân viên
      const empTxData = reportData.employeeTxs?.map((tx: any, index: number) => ({
        'STT': index + 1,
        'Ngày': new Date(tx.createdAt).toLocaleDateString('vi-VN'),
        'Nhân viên': tx.user?.name || '',
        'Loại Giao Dịch': tx.category?.name || '',
        'Tính chất': tx.type === 'CREDIT' ? 'Thu' : 'Chi',
        'Số tiền': tx.amount,
        'Trạng thái': tx.status,
        'Mô tả': tx.description || '',
      })) || [];

      // Sheet 4: Bảng kê Hoa hồng
      const payoutData = reportData.payouts?.map((p: any, index: number) => ({
        'STT': index + 1,
        'Nhân viên': p.user?.name || '',
        'Kỳ (Tháng/Năm)': `${p.periodMonth}/${p.periodYear}`,
        'Tổng Doanh Số': p.totalSales,
        'Hoa hồng nhận': p.commission,
        'Trạng thái': p.status,
      })) || [];

      const wb = XLSX.utils.book_new();
      
      const wsTx = XLSX.utils.json_to_sheet(txData);
      XLSX.utils.book_append_sheet(wb, wsTx, "Sổ Quỹ Công Ty");
      
      const wsOrder = XLSX.utils.json_to_sheet(orderData);
      XLSX.utils.book_append_sheet(wb, wsOrder, "Đơn Hàng");

      const wsEmpTx = XLSX.utils.json_to_sheet(empTxData);
      XLSX.utils.book_append_sheet(wb, wsEmpTx, "Quỹ Nhân Viên");

      const wsPayout = XLSX.utils.json_to_sheet(payoutData);
      XLSX.utils.book_append_sheet(wb, wsPayout, "Hoa Hồng");

      XLSX.writeFile(wb, `Bao_Cao_Thang_${month}_${year}.xlsx`);
      toast.success('Xuất file Excel thành công!');
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi khi xuất file');
    }
  };

  // Tính tổng
  const totalIncome = reportData?.transactions.filter((t: any) => t.type === 'INCOME').reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0;
  const totalExpense = reportData?.transactions.filter((t: any) => t.type === 'EXPENSE').reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0;
  const totalProfit = reportData?.orders.reduce((acc: number, o: any) => acc + Number(o.profit), 0) || 0;

  // Dữ liệu biểu đồ
  const chartDataMap = new Map();
  if (reportData?.transactions) {
    reportData.transactions.forEach((tx: any) => {
      const dateStr = new Date(tx.date).toLocaleDateString('vi-VN');
      if (!chartDataMap.has(dateStr)) {
        chartDataMap.set(dateStr, { name: dateStr, Thu: 0, Chi: 0 });
      }
      if (tx.type === 'INCOME') {
        chartDataMap.get(dateStr).Thu += Number(tx.amount);
      } else if (tx.type === 'EXPENSE') {
        chartDataMap.get(dateStr).Chi += Number(tx.amount);
      }
    });
  }
  const chartData = Array.from(chartDataMap.values()).sort((a, b) => {
    const [d1, m1, y1] = a.name.split('/');
    const [d2, m2, y2] = b.name.split('/');
    return new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Xuất dữ liệu</h1>
          <p className="mt-1 text-sm text-gray-600">Tổng hợp số liệu kinh doanh theo tháng</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={!reportData || loading}
          className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 transition-colors"
        >
          <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất file Excel
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 items-center">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tháng</label>
          <select 
            value={month} 
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
          >
            {Array.from({ length: 12 }).map((_, i) => (
              <option key={i+1} value={i+1}>Tháng {i+1}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Năm</label>
          <input 
            type="number" 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 w-24"
          />
        </div>
        {loading && <div className="text-sm text-gray-500 mt-4 animate-pulse">Đang nạp...</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/transactions" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all cursor-pointer block">
          <h3 className="text-sm font-medium text-gray-500">Tổng Thu (Tháng {month})</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{totalIncome.toLocaleString('vi-VN')} ₫</p>
        </Link>
        <Link href="/transactions" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-red-300 transition-all cursor-pointer block">
          <h3 className="text-sm font-medium text-gray-500">Tổng Chi (Tháng {month})</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">{totalExpense.toLocaleString('vi-VN')} ₫</p>
        </Link>
        <Link href="/orders" className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer block">
          <h3 className="text-sm font-medium text-gray-500">Lợi nhuận Đơn hàng</h3>
          <p className={`mt-2 text-3xl font-bold ${totalProfit < 0 ? 'text-red-600' : 'text-primary-600'}`}>
            {totalProfit.toLocaleString('vi-VN')} ₫
          </p>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Biểu đồ Thu/Chi</h3>
        {chartData.length > 0 ? (
          <div className="h-80 w-full text-sm">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fill: '#6b7280' }} tickLine={false} axisLine={{ stroke: '#d1d5db' }} />
                <YAxis tickFormatter={(val) => (val / 1000000).toFixed(0) + 'Tr'} tick={{ fill: '#6b7280' }} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value: number) => value.toLocaleString('vi-VN') + ' ₫'}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="Thu" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={32} />
                <Bar dataKey="Chi" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Không có dữ liệu giao dịch trong tháng này</span>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
        ℹ️ Nhấn vào nút <strong>Xuất file Excel</strong> ở góc trên bên phải để tải toàn bộ bảng kê chi tiết Đơn hàng và Dòng tiền của tháng {month}/{year} về máy.
      </div>
    </div>
  );
}

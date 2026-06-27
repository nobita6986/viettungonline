'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { create } from 'zustand';
import { formatCurrency } from '@/lib/formatters';

// Zustand Store cho bộ lọc thời gian
interface FilterState {
  timeRange: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'SIX_MONTHS';
  setTimeRange: (range: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'SIX_MONTHS') => void;
}

const useFilterStore = create<FilterState>((set) => ({
  timeRange: 'SIX_MONTHS',
  setTimeRange: (range) => set({ timeRange: range }),
}));

// Màu cho Pie Chart
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export default function MainDashboard({ initialData }: { initialData: any }) {
  const { timeRange, setTimeRange } = useFilterStore();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // Mock fetch function (Trong thực tế sẽ gọi API Route hoặc Server Action truyền vào)
  useEffect(() => {
    // Nếu đổi timeRange thì fetch lại data (Ở đây dùng initialData để demo)
    // setLoading(true);
    // fetch(`/api/dashboard?range=${timeRange}`).then...
  }, [timeRange]);

  const { sixMonthsChart, expenseBreakdown, summary, topProducts, debtSummary } = data;

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan Kinh doanh</h1>
          <p className="text-sm text-gray-600">Báo cáo hiệu suất theo thời gian thực</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-1 rounded-lg inline-flex shadow-sm">
          {(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'SIX_MONTHS'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                timeRange === range 
                  ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100' 
                  : 'text-gray-600 hover:text-primary-700 hover:bg-gray-50'
              }`}
            >
              {range === 'TODAY' ? 'Hôm nay' : 
               range === 'THIS_WEEK' ? 'Tuần này' : 
               range === 'THIS_MONTH' ? 'Tháng này' : '6 Tháng'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Tổng Doanh Thu</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(summary.totalIncome)}</p>
          <div className="mt-4 flex text-sm">
            <span className="text-green-600 font-medium">+12.5%</span>
            <span className="text-gray-500 ml-2">so với kỳ trước</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Tổng Chi Phí</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(summary.totalExpense)}</p>
          <div className="mt-4 flex text-sm">
            <span className="text-red-600 font-medium">+5.2%</span>
            <span className="text-gray-500 ml-2">so với kỳ trước</span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Lợi Nhuận Gộp</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">{formatCurrency(summary.netProfit)}</p>
          <div className="mt-4 flex text-sm">
            <span className="text-green-600 font-medium">+18.1%</span>
            <span className="text-gray-500 ml-2">so với kỳ trước</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Thu / Chi 6 tháng */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Doanh Thu & Chi Phí (6 Tháng)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sixMonthsChart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{fill: '#6b7280'}} />
                <YAxis stroke="#6b7280" tick={{fill: '#6b7280'}} tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
                  itemStyle={{ color: '#111827' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="income" name="Doanh Thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Chi Phí" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Cơ cấu chi phí */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Cơ cấu Chi Phí Vận Hành</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', color: '#111827' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {expenseBreakdown.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center text-xs">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-gray-600 truncate" title={item.name}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Sản Phẩm Bán Chạy</h3>
          <div className="space-y-4">
            {topProducts.map((product: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                    <p className="text-xs text-gray-500">Đã bán: {product.totalQty}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Debt Summary */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tình Trạng Công Nợ</h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Phải Thu (Khách nợ)</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(debtSummary.receivable.total)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(debtSummary.receivable.current / debtSummary.receivable.total) * 100 || 0}%` }}></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Trong hạn: {formatCurrency(debtSummary.receivable.current)}</span>
                <span className="text-red-500">Quá hạn: {formatCurrency(debtSummary.receivable.overdue)}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Phải Trả (Nợ NCC)</span>
                <span className="text-sm font-bold text-red-600">{formatCurrency(debtSummary.payable.total)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(debtSummary.payable.current / debtSummary.payable.total) * 100 || 0}%` }}></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Trong hạn: {formatCurrency(debtSummary.payable.current)}</span>
                <span className="text-red-500">Quá hạn: {formatCurrency(debtSummary.payable.overdue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

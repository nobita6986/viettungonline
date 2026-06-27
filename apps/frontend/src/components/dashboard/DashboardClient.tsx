'use client';

import React, { lazy, Suspense } from 'react';
import { formatCurrency } from '@/lib/formatters';

const RevenueChart_Lazy = lazy(() => import('./RevenueChart'));
const RevenueChart = (props: any) => <Suspense fallback={<div className="h-[300px] flex items-center justify-center text-gray-400">Đang tải biểu đồ...</div>}><RevenueChart_Lazy {...props} /></Suspense>;

interface ChartDataPoint {
  label: string;
  income: number;
  expense: number;
}

interface DashboardClientProps {
  summary: {
    totalIncome: number;
    totalExpense: number;
    profit: number;
    orderCount: number;
    accountBalances: Array<{ code: string; name: string; balance: number }>;
    operational?: { income: number; expense: number; profit: number };
    trading?: { income: number; expense: number; profit: number };
    debtSummary?: {
      receivable: { current: number; overdue: number };
      payable: { current: number; overdue: number };
    };
    topProducts?: Array<{ productName: string; totalQty: number; revenue: number }>;
  };
  chartData: ChartDataPoint[];
}

export default function DashboardClient({ summary, chartData }: DashboardClientProps) {
  const { totalIncome, totalExpense, profit, orderCount, accountBalances, debtSummary, topProducts } = summary;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="mt-1 text-sm text-gray-600">
          Xem nhanh tình hình tài chính và đơn hàng tháng này
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng thu</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng chi</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpense)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lợi nhuận ròng</p>
              <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(profit)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${profit >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <svg className={`w-6 h-6 ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{orderCount || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow Section */}
      {(summary.operational || summary.trading) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dòng tiền Vận hành</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Thu nhập</span>
                <span className="font-medium text-green-600">{formatCurrency(summary.operational?.income || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Chi phí</span>
                <span className="font-medium text-red-600">{formatCurrency(summary.operational?.expense || 0)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-medium text-gray-900">Lợi nhuận</span>
                <span className={`font-bold ${(summary.operational?.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.operational?.profit || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dòng tiền Kinh doanh</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Thu nhập</span>
                <span className="font-medium text-green-600">{formatCurrency(summary.trading?.income || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Chi phí</span>
                <span className="font-medium text-red-600">{formatCurrency(summary.trading?.expense || 0)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-medium text-gray-900">Lợi nhuận</span>
                <span className={`font-bold ${(summary.trading?.profit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.trading?.profit || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Debt Summary */}
      {debtSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-green-700 mb-4">Công nợ phải thu</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Đúng hạn</span>
                <span className="font-medium text-green-600">{formatCurrency(debtSummary.receivable?.current || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Quá hạn</span>
                <span className="font-medium text-red-600">{formatCurrency(debtSummary.receivable?.overdue || 0)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-medium text-gray-900">Tổng cộng</span>
                <span className="font-bold text-green-700">
                  {formatCurrency((debtSummary.receivable?.current || 0) + (debtSummary.receivable?.overdue || 0))}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-4">Công nợ phải trả</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Đúng hạn</span>
                <span className="font-medium text-green-600">{formatCurrency(debtSummary.payable?.current || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Quá hạn</span>
                <span className="font-medium text-red-600">{formatCurrency(debtSummary.payable?.overdue || 0)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-medium text-gray-900">Tổng cộng</span>
                <span className="font-bold text-red-700">
                  {formatCurrency((debtSummary.payable?.current || 0) + (debtSummary.payable?.overdue || 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Biểu đồ Thu/Chi (6 tháng gần nhất)</h2>
          <RevenueChart data={chartData} />
        </div>

        {/* Account balances */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Số dư Tài khoản</h2>
          <div className="space-y-4">
            {accountBalances?.map((acc) => (
              <div key={acc.code} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{acc.name}</p>
                  <p className="text-xs text-gray-500">{acc.code}</p>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(acc.balance)}</p>
              </div>
            ))}
            {(!accountBalances || accountBalances.length === 0) && (
              <p className="text-sm text-gray-500 italic text-center py-4">Chưa có dữ liệu tài khoản</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      {topProducts && topProducts.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top sản phẩm bán chạy</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sản phẩm</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topProducts.map((product, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.productName}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-600">{product.totalQty}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

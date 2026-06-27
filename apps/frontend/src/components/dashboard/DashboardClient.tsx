'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { DashboardSummary, ChartDataPoint } from '@/app/actions/dashboard';
import { formatCurrency } from '@/lib/formatters';

const RevenueChart = dynamic(() => import('./RevenueChart'), { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center text-gray-400">Đang tải biểu đồ...</div> });

interface DashboardClientProps {
  summary: DashboardSummary;
  chartData: ChartDataPoint[];
}

export default function DashboardClient({ summary, chartData }: DashboardClientProps) {
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalIncome)}</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalExpense)}</p>
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
              <p className="text-sm font-medium text-gray-600">Lợi nhuận</p>
              <p className={`text-2xl font-bold mt-1 ${summary.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {formatCurrency(summary.profit)}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${summary.profit >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
              <svg className={`w-6 h-6 ${summary.profit >= 0 ? 'text-blue-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.orderCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Biểu đồ Thu/Chi (30 ngày gần đây)</h2>
          <RevenueChart data={chartData} />
        </div>

        {/* Account balances */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Số dư Tài khoản</h2>
          <div className="space-y-4">
            {summary.accountBalances.map((acc) => (
              <div key={acc.code} className="flex justify-between items-center p-4 border border-gray-100 rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium text-gray-900">{acc.name}</p>
                  <p className="text-xs text-gray-500">{acc.code}</p>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(acc.balance)}</p>
              </div>
            ))}
            {summary.accountBalances.length === 0 && (
              <p className="text-sm text-gray-500 italic text-center py-4">Chưa có dữ liệu tài khoản</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

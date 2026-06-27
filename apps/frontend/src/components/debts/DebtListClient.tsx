'use client';

import React, { useState } from 'react';
import { formatCurrency, formatDateVN } from '@/lib/formatters';
import { Link } from 'react-router-dom';

interface DebtListClientProps {
  initialData: any[];
}

export default function DebtListClient({ initialData }: DebtListClientProps) {
  const [activeTab, setActiveTab] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
  const [searchTerm, setSearchTerm] = useState('');

  // Lọc theo Tab và Search
  const filteredData = initialData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.phone && item.phone.includes(searchTerm));
    
    if (activeTab === 'RECEIVABLE') {
      return item.totalReceivable > 0 && matchesSearch;
    } else {
      return item.totalPayable > 0 && matchesSearch;
    }
  });

  const totalReceivableAll = initialData.reduce((sum, item) => sum + item.totalReceivable, 0);
  const totalPayableAll = initialData.reduce((sum, item) => sum + item.totalPayable, 0);

  return (
    <div className="space-y-6">
      {/* Thống kê Tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div 
          className={`p-6 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'RECEIVABLE' ? 'bg-green-50 border-green-500 shadow-md ring-1 ring-green-500' : 'bg-white border-gray-200 hover:border-green-300'
          }`}
          onClick={() => setActiveTab('RECEIVABLE')}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-green-700 uppercase tracking-wider">Khách nợ mình (Phải thu)</p>
              <h3 className="mt-2 text-3xl font-bold text-green-700">{formatCurrency(totalReceivableAll)}</h3>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-sm text-green-600">Tổng số tiền đang chờ khách thanh toán</p>
        </div>

        <div 
          className={`p-6 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'PAYABLE' ? 'bg-red-50 border-red-500 shadow-md ring-1 ring-red-500' : 'bg-white border-gray-200 hover:border-red-300'
          }`}
          onClick={() => setActiveTab('PAYABLE')}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-red-700 uppercase tracking-wider">Mình nợ NCC (Phải trả)</p>
              <h3 className="mt-2 text-3xl font-bold text-red-700">{formatCurrency(totalPayableAll)}</h3>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
            </div>
          </div>
          <p className="mt-2 text-sm text-red-600">Tổng số tiền cần thanh toán cho nhà cung cấp</p>
        </div>
      </div>

      {/* Tìm kiếm & Danh sách */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {activeTab === 'RECEIVABLE' ? 'Danh sách Khách nợ' : 'Danh sách Chủ nợ'}
          </h2>
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Tìm tên, SĐT..." 
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không tìm thấy dữ liệu công nợ phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng / Đối tác
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng số tiền nợ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chi tiết Đơn hàng chưa thanh toán
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.phone && <div className="text-sm text-gray-500">{item.phone}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-lg font-bold ${activeTab === 'RECEIVABLE' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(activeTab === 'RECEIVABLE' ? item.totalReceivable : item.totalPayable)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <ul className="text-sm text-gray-600 space-y-1">
                        {(activeTab === 'RECEIVABLE' ? item.receivableOrders : item.payableOrders).map((order: any) => (
                          <li key={order.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                            <span className="font-medium text-blue-600 hover:underline">
                              <Link href={`/orders?search=${order.orderCode}`}>{order.orderCode}</Link>
                            </span>
                            <span className="text-gray-500 text-xs mx-2">
                              {formatDateVN(order.saleDate || order.purchaseDate)}
                            </span>
                            <span className="font-semibold text-gray-800">
                              {formatCurrency(order.salePrice || order.purchasePrice)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/orders?search=${item.name}`}
                        className="text-primary-600 hover:text-primary-900 bg-primary-50 px-3 py-1.5 rounded border border-primary-200"
                      >
                        Thu/Chi ngay
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

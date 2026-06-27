'use client';

import React, { useState, useEffect } from 'react';
import { getInventoryHistory } from '@/app/actions/inventory';
import { format } from 'date-fns';

interface InventoryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export default function InventoryHistoryModal({ isOpen, onClose, productId, productName }: InventoryHistoryModalProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && productId) {
      loadHistory();
    }
  }, [isOpen, productId]);

  const loadHistory = async () => {
    setLoading(true);
    const res = await getInventoryHistory(productId);
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl mx-auto flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lịch sử Kho</h2>
            <p className="text-sm text-gray-500 mt-1">{productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 self-start">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-dashed">
              Chưa có lịch sử thay đổi tồn kho nào.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thay đổi</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lý do</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Đơn</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người thực hiện</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-right">
                        <span className={log.changeQty > 0 ? 'text-green-600' : 'text-red-600'}>
                          {log.changeQty > 0 ? '+' : ''}{log.changeQty}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                        {log.reason === 'RESTOCK' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Nhập kho</span>
                        ) : log.reason === 'DAMAGED_GOODS' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">Hàng lỗi</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{log.reason}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate" title={log.note || ''}>
                        {log.note || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-primary-600 hover:underline cursor-pointer">
                        {log.order?.orderCode || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {log.user?.name || 'Hệ thống'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

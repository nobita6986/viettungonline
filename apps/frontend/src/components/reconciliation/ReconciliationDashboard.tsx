'use client';

import { useState } from 'react';
import { reconcileTransactionsWithOrders } from '@/app/actions/reconciliation';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function ReconciliationDashboard({ transactions, orders }: { transactions: any[], orders: any[] }) {
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReconcile = async () => {
    if (!selectedTxId || selectedOrderIds.length === 0) return;
    setIsSubmitting(true);
    const res = await reconcileTransactionsWithOrders(selectedTxId, selectedOrderIds);
    setIsSubmitting(false);
    if (res.success) {
      alert('Khớp lệnh thành công!');
      setSelectedTxId(null);
      setSelectedOrderIds([]);
    } else {
      alert('Lỗi: ' + res.error);
    }
  };

  const selectedTx = transactions.find(t => t.id === selectedTxId);
  const totalSelectedOrderRemaining = orders
    .filter(o => selectedOrderIds.includes(o.id))
    .reduce((sum, o) => sum + o.remainingAmount, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 rounded-xl space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Đối soát Giao dịch & Đơn hàng</h2>
          <p className="text-slate-500 text-sm mt-1">Ghép nối dòng tiền vào đơn hàng (Hỗ trợ 1-N)</p>
        </div>
        <button 
          onClick={handleReconcile}
          disabled={!selectedTxId || selectedOrderIds.length === 0 || isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition-all"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Khớp lệnh'}
        </button>
      </div>

      {selectedTxId && selectedOrderIds.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 flex items-center justify-between">
          <div className="flex gap-8">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Giao dịch đang chọn</span>
              <div className="text-lg font-bold text-indigo-700">{formatCurrency(selectedTx?.remainingAmount || 0)}</div>
            </div>
            <div className="flex flex-col justify-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Tổng nợ ({selectedOrderIds.length} đơn)</span>
              <div className="text-lg font-bold text-rose-600">{formatCurrency(totalSelectedOrderRemaining)}</div>
            </div>
          </div>
          <div>
             {selectedTx?.remainingAmount >= totalSelectedOrderRemaining ? 
               <span className="inline-flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-3 py-1 rounded-full"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg> Đủ thanh toán</span>
             : <span className="inline-flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg> Thanh toán một phần</span>
             }
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 h-[600px]">
        {/* CỘT TRÁI: TRANSACTIONS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 flex justify-between items-center">
              <span>Giao dịch mồ côi (Transactions)</span>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">{transactions.length}</span>
            </h3>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {transactions.map(tx => (
              <div 
                key={tx.id} 
                onClick={() => setSelectedTxId(tx.id === selectedTxId ? null : tx.id)}
                className={`p-4 rounded-lg cursor-pointer border transition-all ${tx.id === selectedTxId ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {tx.type === 'INCOME' ? 'THU' : 'CHI'}
                    </span>
                    <span className="text-slate-500 text-xs">{new Date(tx.date).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="font-bold text-slate-800">{formatCurrency(tx.remainingAmount)}</div>
                </div>
                <div className="text-sm font-medium text-slate-700">{tx.categoryName || '(Không có loại)'}</div>
                {tx.note && <div className="text-sm text-slate-500 truncate mt-1">{tx.note}</div>}
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-10 text-slate-400">Không có giao dịch nào đang chờ đối soát</div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: ORDERS */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-100/50 px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 flex justify-between items-center">
              <span>Đơn hàng treo (Orders)</span>
              <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">{orders.length}</span>
            </h3>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1">
            {orders.map(order => {
              const isSelected = selectedOrderIds.includes(order.id);
              return (
                <div 
                  key={order.id} 
                  onClick={() => {
                    if (isSelected) setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                    else setSelectedOrderIds(prev => [...prev, order.id]);
                  }}
                  className={`p-4 rounded-lg cursor-pointer border transition-all ${isSelected ? 'border-rose-500 bg-rose-50/50 ring-1 ring-rose-500' : 'border-slate-200 hover:border-rose-300 hover:bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2 items-center">
                      <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{order.orderCode}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${order.type === 'SALE' ? 'bg-sky-100 text-sky-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                        {order.type === 'SALE' ? 'BÁN RA' : 'NHẬP VÀO'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-800 text-right">
                      <div className="text-rose-600">{formatCurrency(order.remainingAmount)}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Tổng: {formatCurrency(order.totalAmount)}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-700">Khách: {order.customer?.name || '(Khách lẻ)'}</div>
                  <div className="text-sm text-slate-500 truncate mt-1">Ngày tạo: {new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
              );
            })}
            {orders.length === 0 && (
              <div className="text-center py-10 text-slate-400">Không có đơn hàng nào đang nợ</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

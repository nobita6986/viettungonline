'use client';

import React, { useState, useEffect } from 'react';
import { adjustStock } from '@/app/actions/inventory';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  stockQty: number;
  baseUnit: string;
}

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function AdjustStockModal({ isOpen, onClose, product }: AdjustStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    changeQty: '',
    reason: 'Hàng lỗi',
    note: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({ changeQty: '', reason: 'Hàng lỗi', note: '' });
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(formData.changeQty);
    
    if (!qty || isNaN(qty)) {
      toast.error('Vui lòng nhập số lượng thay đổi hợp lệ');
      return;
    }

    if (qty < 0 && product.stockQty + qty < 0) {
      toast.error(`Không thể trừ quá số lượng tồn kho hiện tại (${product.stockQty})`);
      return;
    }

    setLoading(true);
    try {
      const res = await adjustStock({
        productId: product.id,
        changeQty: qty,
        reason: formData.reason,
        note: formData.note
      });

      if (res.success) {
        toast.success('Điều chỉnh kho thành công');
        onClose();
      } else {
        toast.error(res.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Điều chỉnh kho</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-500">Sản phẩm</label>
            <p className="font-semibold text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500 mt-1">Tồn kho hiện tại: {product.stockQty} {product.baseUnit}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng thay đổi (có thể âm hoặc dương) *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={formData.changeQty}
                onChange={(e) => setFormData({...formData, changeQty: e.target.value})}
                placeholder="VD: -2 hoặc 5"
              />
              <span className="text-gray-500">{product.baseUnit}</span>
            </div>
            {formData.changeQty && !isNaN(Number(formData.changeQty)) && (
              <p className="text-xs text-blue-600 mt-1">
                Tồn kho mới: {product.stockQty + Number(formData.changeQty)} {product.baseUnit}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do *</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
            >
              <option value="Hàng lỗi">Hàng lỗi (Trừ kho)</option>
              <option value="Mất mát">Mất mát (Trừ kho)</option>
              <option value="Kiểm kê thừa">Kiểm kê thừa (Cộng kho)</option>
              <option value="Khác">Lý do khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú cụ thể *</label>
            <textarea
              required
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={formData.note}
              onChange={(e) => setFormData({...formData, note: e.target.value})}
              placeholder="Ghi rõ tình trạng, biên bản..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

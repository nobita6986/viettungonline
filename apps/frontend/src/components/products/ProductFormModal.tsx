'use client';

import React, { useState } from 'react';
import { createProduct } from '@/app/actions/products';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useRouter, usePathname } from '@/hooks/useRouter';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newProduct: any) => void;
}

export default function ProductFormModal({ isOpen, onClose, onSuccess }: ProductFormModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    type: 'STANDARD',
    baseUnit: 'cái',
    buyPrice: '',
    sellPrice: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Tên sản phẩm không được để trống');
    
    if (formData.type === 'COMBO') {
      // Chuyển hướng sang trang tạo Combo
      router.push('/products/combos/new');
      onClose();
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku || undefined,
        type: 'STANDARD' as any,
        baseUnit: formData.baseUnit,
        buyPrice: Number(formData.buyPrice) || 0,
        sellPrice: Number(formData.sellPrice) || 0,
      };

      const res = await createProduct(payload);
      if (res.success && res.data) {
        toast.success('Tạo sản phẩm thành công!');
        if (onSuccess) onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.error || 'Lỗi khi tạo sản phẩm');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Thêm Sản phẩm Mới</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại sản phẩm</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="STANDARD" 
                  checked={formData.type === 'STANDARD'} 
                  onChange={e => setFormData({...formData, type: e.target.value})} 
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-900">Sản phẩm Cơ bản</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="type" 
                  value="COMBO" 
                  checked={formData.type === 'COMBO'} 
                  onChange={e => setFormData({...formData, type: e.target.value})} 
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-900">Combo (Gói sản phẩm)</span>
              </label>
            </div>
            {formData.type === 'COMBO' && (
              <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded border border-blue-100">
                Khi chọn Combo, hệ thống sẽ chuyển bạn sang trang thiết kế Combo chi tiết sau khi bấm Tiếp tục.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
            <input
              required
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="VD: Nhớt Motul 300V..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã SKU</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                placeholder="Để trống sẽ tự sinh"
                disabled={formData.type === 'COMBO'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị gốc *</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.baseUnit}
                onChange={e => setFormData({...formData, baseUnit: e.target.value})}
                placeholder="cái, chiếc, chai..."
                disabled={formData.type === 'COMBO'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập dự kiến (VNĐ)</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.buyPrice}
                onChange={e => setFormData({...formData, buyPrice: e.target.value})}
                disabled={formData.type === 'COMBO'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán dự kiến (VNĐ)</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.sellPrice}
                onChange={e => setFormData({...formData, sellPrice: e.target.value})}
                disabled={formData.type === 'COMBO'}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-medium">Hủy</button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Đang lưu...' : (formData.type === 'COMBO' ? 'Tiếp tục tạo Combo' : 'Lưu Sản phẩm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

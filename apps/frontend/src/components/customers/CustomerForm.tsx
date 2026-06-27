'use client';

import React, { useState, useEffect } from 'react';
import { createCustomer, updateCustomer } from '@/lib/apiActions';
import toast from 'react-hot-toast';

type CustomerType = 'BUYER' | 'SUPPLIER';

interface CustomerFormProps {
  customer?: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerForm({ customer, isOpen, onClose, onSuccess }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'BUYER' as CustomerType,
    isActive: true
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        type: customer.type || 'BUYER',
        isActive: customer.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        type: 'BUYER',
        isActive: true
      });
    }
  }, [customer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let res;
      if (customer?.id) {
        res = await updateCustomer(customer.id, formData);
      } else {
        res = await createCustomer(formData);
      }

      if (res?.success) {
        toast.success(customer ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(res?.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto my-8">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {customer ? 'Sửa thông tin' : 'Thêm Khách hàng/NCC'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex gap-4 mb-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                className="peer sr-only"
                checked={formData.type === 'BUYER'}
                onChange={() => setFormData({ ...formData, type: 'BUYER' })}
              />
              <div className="text-center py-2 px-4 rounded-lg border border-gray-200 peer-checked:bg-blue-50 peer-checked:border-blue-500 peer-checked:text-blue-700 font-medium transition-all">
                Khách mua
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                className="peer sr-only"
                checked={formData.type === 'SUPPLIER'}
                onChange={() => setFormData({ ...formData, type: 'SUPPLIER' })}
              />
              <div className="text-center py-2 px-4 rounded-lg border border-gray-200 peer-checked:bg-orange-50 peer-checked:border-orange-500 peer-checked:text-orange-700 font-medium transition-all">
                Nhà cung cấp
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Điện thoại</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
            <span className="text-sm font-medium text-gray-700">Đang hoạt động</span>
          </label>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

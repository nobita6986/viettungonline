'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface CommissionRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    minAmount: number;
    rateType: 'PERCENT' | 'FIXED';
    rateValue: number;
  }) => Promise<void>;
}

export default function CommissionRuleModal({ isOpen, onClose, onSubmit }: CommissionRuleModalProps) {
  const [name, setName] = useState('');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [rateType, setRateType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [rateValue, setRateValue] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || rateValue < 0 || minAmount < 0) {
      toast.error('Vui lòng điền thông tin hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name,
        minAmount,
        rateType,
        rateValue
      });
      setName('');
      setMinAmount(0);
      setRateType('PERCENT');
      setRateValue(5);
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Thêm Quy Tắc Hoa Hồng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên quy tắc *</label>
            <input
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="VD: Đạt 10tr"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngưỡng doanh thu tối thiểu (VNĐ) *</label>
            <input
              required
              type="number"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={minAmount}
              onChange={(e) => setMinAmount(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại hoa hồng</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={rateType}
                onChange={(e) => setRateType(e.target.value as 'PERCENT' | 'FIXED')}
              >
                <option value="PERCENT">Theo % (Phần trăm)</option>
                <option value="FIXED">Số tiền cụ thể (VNĐ)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {rateType === 'PERCENT' ? 'Phần trăm (%) *' : 'Số tiền/đơn (VNĐ) *'}
              </label>
              <input
                required
                type="number"
                min="0"
                step={rateType === 'PERCENT' ? '0.1' : '1'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={rateValue}
                onChange={(e) => setRateValue(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Đang lưu...' : 'Lưu quy tắc'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

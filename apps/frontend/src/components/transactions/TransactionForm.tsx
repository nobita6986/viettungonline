'use client';

import React, { useState, useEffect } from 'react';
import { TransactionType } from '@prisma/client';
import { createTransaction, updateTransaction } from '@/app/actions/transactions';
import toast from 'react-hot-toast';

import { useCategoryStore, useIncomeCategories, useExpenseCategories } from '@/stores/useCategoryStore';

interface Account {
  id: string;
  name: string;
  code: string;
}

interface TransactionFormProps {
  transaction?: any;
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({
  transaction,
  accounts,
  isOpen,
  onClose,
  onSuccess
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Zustand Store
  const { fetchCategories, createQuickly } = useCategoryStore();
  const incomeCategories = useIncomeCategories();
  const expenseCategories = useExpenseCategories();
  const [searchCat, setSearchCat] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'EXPENSE' as TransactionType,
    amount: '',
    description: '',
    categoryId: '',
    accountId: ''
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        type: transaction.type || 'EXPENSE',
        amount: transaction.amount ? transaction.amount.toString() : '',
        description: transaction.description || '',
        categoryId: transaction.categoryId || '',
        accountId: transaction.accountId || (accounts.length > 0 ? accounts[0].id : '')
      });
      // Nếu có categoryRef, set tên danh mục vào searchCat
      if (transaction.categoryRef) {
        setSearchCat(transaction.categoryRef.name);
      } else {
        setSearchCat(transaction.category || '');
      }
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'EXPENSE',
        amount: '',
        description: '',
        categoryId: '',
        accountId: accounts.length > 0 ? accounts[0].id : ''
      });
      setSearchCat('');
    }
  }, [transaction, accounts, isOpen]);

  const currentCategories = formData.type === 'INCOME' ? incomeCategories : expenseCategories;
  const filteredCats = currentCategories.filter((c: any) => c.name.toLowerCase().includes(searchCat.toLowerCase()));
  const exactMatch = currentCategories.find((c: any) => c.name.toLowerCase() === searchCat.trim().toLowerCase());

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        date: new Date(formData.date).toISOString()
      };

      let res;
      if (transaction?.id) {
        res = await updateTransaction(transaction.id, payload);
      } else {
        res = await createTransaction(payload);
      }

      if (res?.success) {
        toast.success(transaction ? 'Cập nhật thành công!' : 'Thêm mới thành công!');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {transaction ? 'Sửa giao dịch' : 'Thêm giao dịch'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex gap-4 mb-4">
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                className="peer sr-only"
                checked={formData.type === 'INCOME'}
                onChange={() => setFormData({ ...formData, type: 'INCOME' })}
              />
              <div className="text-center py-2 px-4 rounded-lg border border-gray-200 peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 font-medium transition-all">
                Thu Tiền
              </div>
            </label>
            <label className="flex-1 cursor-pointer">
              <input
                type="radio"
                name="type"
                className="peer sr-only"
                checked={formData.type === 'EXPENSE'}
                onChange={() => setFormData({ ...formData, type: 'EXPENSE' })}
              />
              <div className="text-center py-2 px-4 rounded-lg border border-gray-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 font-medium transition-all">
                Chi Tiền
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao dịch</label>
            <input
              type="date"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ)</label>
            <input
              type="number"
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="VD: 500000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tài khoản</label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            >
              <option value="" disabled>Chọn tài khoản</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Gõ để tìm hoặc tạo mới..."
              value={searchCat}
              onChange={(e) => {
                setSearchCat(e.target.value);
                setShowCatDropdown(true);
                setFormData(prev => ({ ...prev, categoryId: '' })); // Reset ID khi user gõ mới
              }}
              onFocus={() => setShowCatDropdown(true)}
              onBlur={() => setTimeout(() => setShowCatDropdown(false), 200)}
            />
            {showCatDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCats.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="px-4 py-2 hover:bg-primary-50 cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setSearchCat(cat.name);
                      setFormData(prev => ({ ...prev, categoryId: cat.id }));
                      setShowCatDropdown(false);
                    }}
                  >
                    <span className="font-medium text-gray-800">{cat.name}</span>
                  </div>
                ))}
                
                {searchCat.trim() && !exactMatch && (
                  <div
                    className="px-4 py-2 bg-gray-50 hover:bg-primary-50 cursor-pointer border-t border-gray-100 flex items-center text-primary-600 font-medium"
                    onClick={async () => {
                      setIsCreatingCat(true);
                      const newCat = await createQuickly(searchCat, formData.type as 'INCOME' | 'EXPENSE');
                      if (newCat) {
                        setSearchCat(newCat.name);
                        setFormData(prev => ({ ...prev, categoryId: newCat.id }));
                        toast.success('Tạo danh mục mới thành công');
                      } else {
                        toast.error('Lỗi khi tạo danh mục');
                      }
                      setIsCreatingCat(false);
                      setShowCatDropdown(false);
                    }}
                  >
                    {isCreatingCat ? (
                      <span className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        Đang tạo...
                      </span>
                    ) : (
                      <span className="text-sm">+ Tạo mới: "{searchCat}"</span>
                    )}
                  </div>
                )}
                {!searchCat.trim() && filteredCats.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500 italic">Chưa có danh mục nào</div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả (Ghi chú)</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Nội dung giao dịch..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex gap-3">
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
              {loading ? 'Đang lưu...' : 'Lưu giao dịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

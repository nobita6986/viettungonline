'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getTransactionCategories, createTransactionCategory } from '@/app/actions/employee-transactions';
import CurrencyInput from '@/components/ui/CurrencyInput';
import toast from 'react-hot-toast';

const txSchema = z.object({
  categoryId: z.string().min(1, 'Vui lòng chọn loại giao dịch'),
  amount: z.number().min(1, 'Số tiền phải lớn hơn 0'),
  type: z.string().min(1, 'Vui lòng chọn tính chất (Thu/Chi)'),
  description: z.string().optional(),
  orderId: z.string().optional(),
});

type TxFormValues = z.infer<typeof txSchema>;

interface Props {
  userId: string;
  initialData?: any;
  onSubmit: (data: TxFormValues & { userId: string }) => Promise<boolean>;
  onCancel: () => void;
}

export default function EmployeeTxForm({ userId, initialData, onSubmit, onCancel }: Props) {
  const [categories, setCategories] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const res = await fetch('/api/ai/parse-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data }),
        });
        
        const data = await res.json();
        if (data.success && data.data) {
          setValue('amount', data.data.amount || 0);
          setValue('description', `${data.data.vendor || ''} - ${data.data.suggestedCategory || ''}`);
          
          // Auto create or match category logic could go here, but for now we let user pick.
          // Or we can auto-fill description.
          toast.success('AI đọc hóa đơn thành công!');
        } else {
          toast.error(data.error || 'Lỗi khi đọc hóa đơn');
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsUploading(false);
      toast.error('Lỗi khi tải ảnh lên');
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TxFormValues>({
    resolver: zodResolver(txSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || '',
      amount: initialData?.amount ? Number(initialData.amount) : 0,
      type: initialData?.type || 'CREDIT',
      description: initialData?.description || '',
      orderId: initialData?.orderId || '',
    },
  });

  const selectedCategoryId = watch('categoryId');

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'NEW') {
      setIsCreatingCategory(true);
      setValue('categoryId', '');
    } else {
      setIsCreatingCategory(false);
      setValue('categoryId', e.target.value);
    }
  };

  const handleCreateNewCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Vui lòng nhập tên loại giao dịch');
      return;
    }
    const res = await createTransactionCategory(newCatName, newCatType);
    if (res.success && res.data) {
      toast.success('Thêm loại giao dịch thành công');
      setCategories([...categories, res.data]);
      setValue('categoryId', res.data.id);
      setIsCreatingCategory(false);
      setNewCatName('');
    } else {
      toast.error(res.error || 'Có lỗi xảy ra');
    }
  };

  useEffect(() => {
    getTransactionCategories().then(res => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  // Auto-set type based on category ONLY if not editing and the user hasn't manually changed it yet
  useEffect(() => {
    if (initialData) return;
    const cat = categories.find(c => c.id === selectedCategoryId);
    if (cat) {
      if (cat.type === 'EXPENSE') setValue('type', 'CREDIT'); // Default: NV chi hộ -> Công ty nợ NV
      else if (cat.type === 'INCOME') setValue('type', 'DEBIT'); // Default: NV thu hộ -> NV nợ công ty
    }
  }, [selectedCategoryId, categories, setValue, initialData]);

  const handleFormSubmit = async (data: TxFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, userId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* AI Receipt Parsing */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-900 flex items-center gap-2">
            ✨ Smart ERP AI
          </h3>
          <p className="text-xs text-blue-700 mt-1">
            Tải lên ảnh hóa đơn (xăng xe, ăn uống), AI sẽ tự động điền số tiền và mô tả.
          </p>
        </div>
        <div>
          <label className={`cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white ${isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {isUploading ? 'Đang đọc...' : 'Upload Hóa Đơn AI'}
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Loại giao dịch *</label>
        {!isCreatingCategory ? (
          <select
            value={watch('categoryId') || ''}
            onChange={handleCategoryChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">-- Chọn loại giao dịch --</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value="NEW" className="font-bold text-primary-600">+ Thêm loại chi tiêu mới...</option>
          </select>
        ) : (
          <div className="mt-1 flex items-center gap-2 bg-gray-50 p-3 rounded-md border border-gray-200">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nhập tên loại..."
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
            <select
              value={newCatType}
              onChange={(e) => setNewCatType(e.target.value as any)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="EXPENSE">Công ty Xuất Quỹ (Chi)</option>
              <option value="INCOME">Công ty Nhập Quỹ (Thu)</option>
            </select>
            <button
              type="button"
              onClick={handleCreateNewCategory}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingCategory(false)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        )}
        {errors.categoryId && !isCreatingCategory && <p className="mt-1 text-sm text-red-600">{errors.categoryId.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Số tiền (VNĐ) *</label>
        <CurrencyInput
          value={watch('amount')}
          onChange={(val) => setValue('amount', val)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="Nhập số tiền..."
        />
        {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Tính chất Công nợ (Đối với nhân viên)</label>
        <div className="mt-2 flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input type="radio" value="CREDIT" {...register('type')} className="form-radio text-primary-600" />
            <span className="ml-2 text-sm text-gray-700">Ghi CÓ (+ Tiền NV: Chi hộ, Lương...)</span>
          </label>
          <label className="inline-flex items-center">
            <input type="radio" value="DEBIT" {...register('type')} className="form-radio text-primary-600" />
            <span className="ml-2 text-sm text-gray-700">Ghi NỢ (- Tiền NV: Tạm ứng, Thu hộ...)</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mã đơn hàng (nếu có)</label>
        <input
          type="text"
          {...register('orderId')}
          placeholder="Ví dụ: ORD123..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Ghi chú / Mô tả</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="Lý do chi, thông tin khách hàng..."
        />
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
        >
          Hủy bỏ
        </button>
      </div>
    </form>
  );
}

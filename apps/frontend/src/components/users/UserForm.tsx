'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { getRoles } from '@/app/actions/users';

const userSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  name: z.string().min(1, 'Vui lòng nhập tên'),
  phone: z.string().optional(),
  referralCode: z.string().optional(),
  password: z.string().optional(),
  roleId: z.string().optional(),
  baseSalary: z.string().optional(),
  isActive: z.boolean().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
  initialData?: any;
  onSubmit: (data: UserFormValues) => Promise<boolean>;
  onCancel: () => void;
}

export default function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      referralCode: '',
      password: '',
      roleId: '',
      baseSalary: '',
      isActive: true,
    },
  });

  useEffect(() => {
    // Load roles
    getRoles().then((res) => {
      if (res.success && res.data) {
        setRoles(res.data);
      }
    });

    if (initialData) {
      reset({
        email: initialData.email || '',
        name: initialData.name || '',
        phone: initialData.phone || '',
        referralCode: initialData.referralCode || '',
        password: '', // Don't show password
        roleId: initialData.roleId || '',
        baseSalary: initialData.baseSalary ? String(initialData.baseSalary) : '',
        isActive: initialData.isActive !== false,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: UserFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await onSubmit(data);
      if (success) reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tên người dùng *</label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
          <input
            type="text"
            {...register('phone')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Lương cơ bản (VNĐ)</label>
          <input
            type="number"
            {...register('baseSalary')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mã giới thiệu (Referral)</label>
          <input
            type="text"
            {...register('referralCode')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Role (Nhóm quyền)</label>
          <select
            {...register('roleId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="">-- Chọn Role --</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            {initialData ? 'Mật khẩu mới (Bỏ trống nếu không đổi)' : 'Mật khẩu'}
          </label>
          <input
            type="password"
            {...register('password')}
            placeholder={initialData ? '***' : 'Nhập mật khẩu...'}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          />
        </div>

        <div className="flex items-center mt-6">
          <input
            type="checkbox"
            {...register('isActive')}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">Hoạt động (Active)</label>
        </div>
      </div>

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
        >
          {isSubmitting ? 'Đang xử lý...' : 'Lưu lại'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1 sm:text-sm"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

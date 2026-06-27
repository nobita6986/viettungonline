'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
import { formatCurrency, formatDateVN } from '@/lib/formatters';
import TransactionForm from './TransactionForm';
import { deleteTransaction } from '@/app/actions/transactions';
import toast from 'react-hot-toast';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';

interface TransactionListClientProps {
  transactions: any[];
  accounts: any[];
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
  stats?: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

export default function TransactionListClient(props: TransactionListClientProps) {
  const { transactions, accounts } = props;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterAccount = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('accountId', e.target.value);
    } else {
      params.delete('accountId');
    }
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterType = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('type', e.target.value);
    } else {
      params.delete('type');
    }
    params.set('page', '1'); // reset page
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleAdd = () => {
    setSelectedTx(null);
    setIsFormOpen(true);
  };

  const handleEdit = (tx: any) => {
    setSelectedTx(tx);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      const res = await deleteTransaction(id);
      if (res.success) {
        toast.success('Xóa thành công');
      } else {
        toast.error(res.error || 'Lỗi khi xóa');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Thu/Chi</h1>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi dòng tiền vào và ra
          </p>
        </div>
        <button
          onClick={handleAdd}
          type="button"
          className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-colors"
        >
          <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm giao dịch
        </button>
      </div>

      {/* Quick Stats & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Main Balance Box */}
          <div className="px-6 py-4 bg-blue-600 rounded-xl shadow-md border border-blue-700 transform hover:scale-105 transition-transform cursor-default flex flex-col justify-center min-w-[200px]">
            <span className="text-sm text-blue-100 block font-medium uppercase tracking-wider mb-1">Tồn quỹ chung</span>
            <span className="font-bold text-white text-2xl">{formatCurrency(props.stats?.balance || 0)}</span>
          </div>

          {/* Accounts Column (Swapped position) */}
          <div className="flex flex-col gap-2 border-l border-gray-200 pl-6">
            {accounts.map(acc => (
              <div key={acc.id} className="flex justify-between items-center min-w-[160px] gap-4">
                <span className="text-xs text-gray-500 font-medium">{acc.name}</span>
                <span className="font-semibold text-gray-900 text-sm">{formatCurrency(acc.balance || 0)}</span>
              </div>
            ))}
          </div>

          {/* Income, Expense, Profit Column (Swapped position) */}
          <div className="flex flex-col gap-2 border-l border-gray-200 pl-6">
            <div className="flex justify-between items-center min-w-[180px] gap-4">
              <span className="text-xs text-gray-500 font-medium uppercase">Tổng thu</span>
              <span className="font-bold text-green-600 text-sm">{formatCurrency(props.stats?.totalIncome || 0)}</span>
            </div>
            <div className="flex justify-between items-center min-w-[180px] gap-4">
              <span className="text-xs text-gray-500 font-medium uppercase">Tổng chi</span>
              <span className="font-bold text-red-600 text-sm">{formatCurrency(props.stats?.totalExpense || 0)}</span>
            </div>
            <div className="flex justify-between items-center min-w-[180px] gap-4 border-t border-gray-200 pt-2 mt-1">
              <span className="text-xs text-gray-800 font-bold uppercase">Lãi / Lỗ</span>
              <span className={clsx("font-bold text-sm", (props.stats?.totalIncome || 0) >= (props.stats?.totalExpense || 0) ? "text-green-600" : "text-red-600")}>
                {formatCurrency((props.stats?.totalIncome || 0) - (props.stats?.totalExpense || 0))}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 min-w-[240px]">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="filter-account" className="text-sm font-medium text-gray-700 whitespace-nowrap">Tài khoản:</label>
            <select
              id="filter-account"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={searchParams.get('accountId') || ''}
              onChange={handleFilterAccount}
            >
              <option value="">Tất cả</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <label htmlFor="filter-type" className="text-sm font-medium text-gray-700 whitespace-nowrap">Lọc theo:</label>
            <select
              id="filter-type"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={searchParams.get('type') || ''}
              onChange={handleFilterType}
            >
              <option value="">Tất cả Giao dịch</option>
              <option value="INCOME">Chỉ Thu tiền</option>
              <option value="EXPENSE">Chỉ Chi tiền</option>
              <option value="PROFIT">Chỉ Tiền Lãi</option>
              <option value="COST">Chỉ Tiền Giá vốn</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <SortableHeader columnKey="date" title="Ngày" />
                <SortableHeader columnKey="type" title="Loại" />
                <SortableHeader columnKey="amount" title="Số tiền" />
                <SortableHeader columnKey="category" title="Danh mục" />
                <SortableHeader columnKey="description" title="Mô tả" />
                <SortableHeader columnKey="account" title="Tài khoản" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người chi/thu</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500 text-center" colSpan={9}>
                    Chưa có dữ liệu giao dịch.
                  </td>
                </tr>
              ) : (
                transactions.map((tx, index) => {
                  const stt = props.pagination ? (props.pagination.page - 1) * props.pagination.limit + index + 1 : index + 1;
                  return (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateVN(tx.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tx.type === 'INCOME' || tx.type === 'PROFIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tx.type === 'INCOME' ? 'Thu' : tx.type === 'PROFIT' ? 'Lãi' : 'Chi'}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${tx.type === 'INCOME' || tx.type === 'PROFIT' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'EXPENSE' || tx.type === 'COST' ? '-' : '+'}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(tx.categoryRef?.name || tx.category) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {tx.categoryRef?.name || tx.category}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">---</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px] truncate" title={tx.description}>
                      {tx.description || <span className="text-gray-400 italic">Không có mô tả</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.account?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {tx.employeeTransaction?.user?.name ? (
                        <span className="font-medium text-blue-600">{tx.employeeTransaction.user.name}</span>
                      ) : (
                        <span className="text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">Trần Sơn Tùng</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleEdit(tx)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="text-red-600 hover:text-red-900">
                        Xóa
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {props.pagination && (
          <Pagination 
            currentPage={props.pagination.page}
            totalPages={props.pagination.totalPages}
            totalItems={props.pagination.total}
            pageSize={props.pagination.limit}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <TransactionForm  
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        transaction={selectedTx}
        accounts={accounts}
        onSuccess={() => {}}
      />
    </div>
  );
}

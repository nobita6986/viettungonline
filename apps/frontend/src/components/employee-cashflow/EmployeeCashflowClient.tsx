'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, CheckCircleIcon, XCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import EmployeeTxForm from './EmployeeTxForm';
import { createEmployeeTransaction, updateEmployeeTransaction, deleteEmployeeTransaction, approveEmployeeTransaction, rejectEmployeeTransaction, approveMultipleEmployeeTransactions } from '@/app/actions/employee-transactions';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/formatters';
import { usePermissions } from '@/hooks/usePermissions';
import { useSearchParams } from 'react-router-dom';
import { useRouter, usePathname } from '@/hooks/useRouter';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';

interface Props {
  initialData: any[];
  currentUser: any;
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
  summaryData?: {
    name: string;
    baseSalary: number;
    totalCredit: number;
    totalDebit: number;
    pendingCredit?: number;
    pendingDebit?: number;
    estimatedCommission: number;
    balance: number;
  };
  transactionCategories?: any[];
}

export default function EmployeeCashflowClient(props: Props) {
  const { initialData, currentUser, transactionCategories = [] } = props;
  const [transactions, setTransactions] = useState(initialData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  
  // Custom Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    txId: string | null;
    isBulk: boolean;
    selectedGroup: 'OPERATIONAL' | 'TRADING';
    selectedCategoryId: string;
  }>({
    isOpen: false,
    txId: null,
    isBulk: false,
    selectedGroup: 'OPERATIONAL',
    selectedCategoryId: '',
  });
  
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const isApprover = currentUser.role === 'ADMIN' || currentUser.role === 'ACCOUNTANT';
  const { hasPermission } = usePermissions();
  const canManage = hasPermission('MANAGE_EMPLOYEE_EXPENSE') || isApprover;
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCreateNew = () => {
    setSelectedTx(null);
    setIsModalOpen(true);
  };

  const handleEdit = (tx: any) => {
    setSelectedTx(tx);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa giao dịch',
      message: 'Bạn có chắc chắn muốn xóa giao dịch này? Nếu đã duyệt, sổ quỹ công ty cũng sẽ bị trừ tương ứng.',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const res = await deleteEmployeeTransaction(id);
        if (res.success) {
          toast.success('Xóa giao dịch thành công');
          setTransactions(transactions.filter((t: any) => t.id !== id));
        } else {
          toast.error(res.error || 'Lỗi khi xóa giao dịch');
        }
      }
    });
  };

  const handleApprove = (id: string) => {
    setApproveModal({
      isOpen: true,
      txId: id,
      isBulk: false,
      selectedGroup: 'OPERATIONAL',
      selectedCategoryId: transactionCategories[0]?.id || '',
    });
  };

  const submitApprove = async () => {
    const { txId, isBulk, selectedGroup, selectedCategoryId } = approveModal;
    if (!selectedCategoryId) {
      toast.error('Vui lòng chọn Sub-category');
      return;
    }

    setApproveModal(prev => ({ ...prev, isOpen: false }));
    
    if (isBulk) {
      setIsBulkApproving(true);
      const res = await approveMultipleEmployeeTransactions(selectedTxIds, selectedGroup, selectedCategoryId);
      setIsBulkApproving(false);
      if (res.success) {
        const hasErrors = res.data?.some((r: any) => !r.success);
        if (hasErrors) {
          const firstError = res.data?.find((r: any) => !r.success)?.error;
          toast.error(`Lỗi duyệt: ${firstError}`);
        } else {
          toast.success(`Đã duyệt thành công ${selectedTxIds.length} giao dịch`);
          setTransactions(transactions.map((t: any) => selectedTxIds.includes(t.id) ? { ...t, status: 'APPROVED' } : t));
          setSelectedTxIds([]);
        }
      } else {
        toast.error(res.error || 'Lỗi duyệt hàng loạt');
      }
    } else if (txId) {
      const res = await approveEmployeeTransaction(txId, selectedGroup, selectedCategoryId);
      if (res.success) {
        toast.success('Duyệt thành công');
        setTransactions(transactions.map((t: any) => (t.id === txId ? res.data : t)));
      } else {
        toast.error(res.error || 'Lỗi duyệt');
      }
    }
  };

  const handleReject = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Từ chối giao dịch',
      message: 'Bạn có chắc chắn muốn từ chối giao dịch này?',
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const res = await rejectEmployeeTransaction(id);
        if (res.success) {
          toast.success('Từ chối thành công');
          setTransactions(transactions.map((t: any) => (t.id === id ? res.data : t)));
        } else {
          toast.error(res.error || 'Lỗi thao tác');
        }
      }
    });
  };

  const handleSubmitForm = async (data: any) => {
    if (selectedTx) {
      const res = await updateEmployeeTransaction(selectedTx.id, data);
      if (res.success && res.data) {
        toast.success('Cập nhật thành công');
        setTransactions(transactions.map((t) => t.id === selectedTx.id ? res.data : t));
        setIsModalOpen(false);
        return true;
      } else {
        toast.error(res.error || 'Có lỗi xảy ra');
        return false;
      }
    } else {
      const res = await createEmployeeTransaction(data);
      if (res.success && res.data) {
        toast.success('Tạo phiếu thành công');
        setTransactions([res.data, ...transactions]);
        setIsModalOpen(false);
        return true;
      } else {
        toast.error(res.error || 'Có lỗi xảy ra');
        return false;
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const pendingIds = transactions.filter((t: any) => t.status === 'PENDING').map((t: any) => t.id);
      setSelectedTxIds(pendingIds);
    } else {
      setSelectedTxIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(txId => txId !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (selectedTxIds.length === 0) return;
    setApproveModal({
      isOpen: true,
      txId: null,
      isBulk: true,
      selectedGroup: 'OPERATIONAL',
      selectedCategoryId: transactionCategories[0]?.id || '',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Chờ duyệt</span>;
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Đã duyệt</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Từ chối</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sổ quỹ & Công nợ NV</h1>
          <p className="mt-1 text-sm text-gray-600">
            {isApprover ? 'Quản lý và xét duyệt các phiếu chi/thu hộ của nhân viên.' : 'Tạo phiếu đề nghị thanh toán / thu hộ khách hàng.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {isApprover && selectedTxIds.length > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={isBulkApproving}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none disabled:opacity-50"
            >
              <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Duyệt {selectedTxIds.length} phiếu
            </button>
          )}
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Tạo Phiếu Mới
          </button>
        </div>
      </div>

      {props.summaryData && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {props.summaryData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Tổng kết tài chính: {props.summaryData.name}</h2>
              <p className="text-sm text-gray-600">Thông tin dòng tiền và công nợ của nhân viên tính đến hiện tại.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Lương cơ bản</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{formatCurrency(props.summaryData.baseSalary)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Hoa hồng (tạm tính)</p>
                <p className="mt-1 text-xl font-bold text-green-600">+{formatCurrency(props.summaryData.estimatedCommission)}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Công ty Nợ NV (Đã duyệt)</p>
                <p className="mt-1 text-xl font-bold text-green-600">+{formatCurrency(props.summaryData.totalCredit)}</p>
              </div>
              {props.summaryData.pendingCredit ? (
                <p className="text-xs text-yellow-600 mt-2 font-medium bg-yellow-50 px-2 py-1 rounded inline-block w-fit">
                  Chờ duyệt: +{formatCurrency(props.summaryData.pendingCredit)}
                </p>
              ) : null}
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">NV Nợ Công ty (Đã duyệt)</p>
                <p className="mt-1 text-xl font-bold text-red-600">-{formatCurrency(props.summaryData.totalDebit)}</p>
              </div>
              {props.summaryData.pendingDebit ? (
                <p className="text-xs text-yellow-600 mt-2 font-medium bg-yellow-50 px-2 py-1 rounded inline-block w-fit">
                  Chờ duyệt: -{formatCurrency(props.summaryData.pendingDebit)}
                </p>
              ) : null}
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-200 bg-indigo-50 flex flex-col justify-between">
              <p className="text-sm font-medium text-indigo-700">Dư Nợ (Công nợ hiện tại)</p>
              <p className={`mt-1 text-2xl font-black ${props.summaryData.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {props.summaryData.balance >= 0 ? '+' : ''}{formatCurrency(props.summaryData.balance)}
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                {props.summaryData.balance >= 0 ? 'Công ty phải trả NV' : 'NV phải trả Công ty'}
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-gray-700 font-medium">
              Tổng thu nhập dự kiến cuối tháng: <span className="text-lg text-primary-700 font-bold ml-1">{formatCurrency(props.summaryData.baseSalary + props.summaryData.estimatedCommission + props.summaryData.balance)}</span>
            </p>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isApprover && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 tracking-wider w-10">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      checked={transactions.filter((t: any) => t.status === 'PENDING').length > 0 && selectedTxIds.length === transactions.filter((t: any) => t.status === 'PENDING').length}
                      onChange={handleSelectAll}
                    />
                  </th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STT
                </th>
                <SortableHeader columnKey="createdAt" title="Ngày tạo" />
                <SortableHeader columnKey="user" title="Nhân viên" />
                <SortableHeader columnKey="category" title="Loại Giao Dịch" />
                <SortableHeader columnKey="amount" title="Số tiền" align="right" />
                <SortableHeader columnKey="status" title="Trạng thái" align="center" />
                {isApprover && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duyệt
                  </th>
                )}
                {canManage && (
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((tx: any, index: number) => {
                const stt = props.pagination ? (props.pagination.page - 1) * props.pagination.limit + index + 1 : index + 1;
                return (
                <tr key={tx.id} className={`hover:bg-gray-50 transition-colors ${selectedTxIds.includes(tx.id) ? 'bg-blue-50' : ''}`}>
                  {isApprover && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.status === 'PENDING' ? (
                        <input
                          type="checkbox"
                          className="form-checkbox h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                          checked={selectedTxIds.includes(tx.id)}
                          onChange={() => handleSelect(tx.id)}
                        />
                      ) : null}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/employee-cashflow?userId=${tx.userId}`} className="hover:underline">
                      <div className="text-sm font-medium text-blue-600">{tx.user?.name}</div>
                      <div className="text-sm text-gray-500">{tx.user?.email}</div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{tx.category?.name}</div>
                    {tx.description && <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={tx.description}>{tx.description}</div>}
                    {tx.orderId && <div className="text-xs text-indigo-600 mt-1 font-mono">#{tx.orderId}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <span className={tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {getStatusBadge(tx.status)}
                  </td>
                  {isApprover && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {tx.status === 'PENDING' && (
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleApprove(tx.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Duyệt"
                          >
                            <CheckCircleIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={() => handleReject(tx.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Từ chối"
                          >
                            <XCircleIcon className="h-6 w-6" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                  {canManage && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Sửa"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={isApprover ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                    Chưa có giao dịch nào
                  </td>
                </tr>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setIsModalOpen(false)}></div>
            </div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block transform overflow-visible rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl sm:p-6 sm:align-middle relative z-10">
              <div className="mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {selectedTx ? 'Sửa Phiếu Đề Nghị / Báo Thu' : 'Tạo Phiếu Đề Nghị / Báo Thu'}
                </h3>
              </div>
              <EmployeeTxForm
                userId={currentUser.id}
                initialData={selectedTx}
                onSubmit={handleSubmitForm}
                onCancel={() => setIsModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}></div>
            </div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block transform overflow-visible rounded-xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle relative z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-xl">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircleIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg font-bold leading-6 text-gray-900" id="modal-title">
                      {confirmModal.title}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {confirmModal.message}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-xl border-t border-gray-200">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={confirmModal.onConfirm}
                >
                  Đồng ý
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPROVAL MODAL WITH CATEGORY SELECTION */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75 backdrop-blur-sm" onClick={() => setApproveModal(prev => ({ ...prev, isOpen: false }))}></div>
            </div>
            <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block transform overflow-visible rounded-xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:align-middle relative z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 rounded-t-xl">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircleIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg font-bold leading-6 text-gray-900" id="modal-title">
                      {approveModal.isBulk ? `Duyệt hàng loạt (${selectedTxIds.length} giao dịch)` : 'Duyệt giao dịch'}
                    </h3>
                    <div className="mt-4 space-y-4 text-left">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Phân loại Dòng tiền</label>
                        <select 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          value={approveModal.selectedGroup}
                          onChange={(e) => setApproveModal(prev => ({ ...prev, selectedGroup: e.target.value as any }))}
                        >
                          <option value="OPERATIONAL">Dòng tiền Vận hành (Operational)</option>
                          <option value="TRADING">Dòng tiền Kinh doanh (Trading)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Danh mục (Sub-category)</label>
                        <select 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                          value={approveModal.selectedCategoryId}
                          onChange={(e) => setApproveModal(prev => ({ ...prev, selectedCategoryId: e.target.value }))}
                        >
                          <option value="">-- Chọn danh mục --</option>
                          {transactionCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Lưu ý: Sau khi duyệt, khoản tiền này sẽ tự động cộng/trừ vào sổ quỹ của công ty.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 rounded-b-xl border-t border-gray-200">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={submitApprove}
                >
                  Xác nhận Duyệt
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  onClick={() => setApproveModal(prev => ({ ...prev, isOpen: false }))}
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

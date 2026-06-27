'use client';

import React, { useState } from 'react';
import { formatCurrency, formatDateVN } from '@/lib/formatters';
import OrderForm from './OrderForm';
import toast from 'react-hot-toast';
import { usePermissions } from '@/hooks/usePermissions';
import { deleteOrder } from '@/app/actions/orders';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';

interface OrderListClientProps {
  orders: any[];
  customers: any[];
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export default function OrderListClient(props: OrderListClientProps) {
  const { orders, customers } = props;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [localOrders, setLocalOrders] = useState(orders);
  const { hasPermission } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const canUpdate = hasPermission('ORDER_UPDATE');
  const canDelete = hasPermission('ORDER_DELETE');

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleAdd = () => {
    setSelectedOrder(null);
    setIsFormOpen(true);
  };

  const handleEdit = (order: any) => {
    setSelectedOrder(order);
    setIsFormOpen(true);
  };

  const { mutate: mutateDelete, isPending: isDeleting } = useOptimisticMutation({
    mutationFn: deleteOrder,
    onSuccess: () => toast.success('Xóa đơn hàng thành công')
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này sẽ hoàn trả lại tồn kho và hủy các khoản thu liên quan.')) {
      mutateDelete(
        id,
        (currentOrders: any[]) => currentOrders.filter((o: any) => o.id !== id),
        localOrders,
        setLocalOrders
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h1>
          <p className="mt-1 text-sm text-gray-600">
            Theo dõi đơn mua vào và đơn bán ra
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAdd}
            className="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 transition-colors"
          >
            <svg className="-ml-0.5 mr-1.5 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tạo đơn hàng
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STT</th>
                <SortableHeader columnKey="orderCode" title="Mã đơn" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hàng</th>
                <SortableHeader columnKey="customer" title="Khách hàng" />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                <SortableHeader columnKey="purchasePrice" title="Giá mua" />
                <SortableHeader columnKey="salePrice" title="Giá bán" />
                <SortableHeader columnKey="profit" title="Lãi" />
                <SortableHeader columnKey="status" title="Trạng thái" />
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localOrders.length === 0 ? (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500 text-center" colSpan={10}>
                    Chưa có dữ liệu đơn hàng.
                  </td>
                </tr>
              ) : (
                localOrders.map((order, index) => {
                  const stt = props.pagination ? (props.pagination.page - 1) * props.pagination.limit + index + 1 : index + 1;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderCode}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.items && order.items.length > 0 ? order.items[0].productName : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer?.name || 'Khách lẻ'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.purchaseUnit && order.saleUnit && order.purchaseUnit !== order.saleUnit ? 
                        `Mua: ${order.purchaseUnit} | Bán: ${order.saleUnit}` : 
                        (order.saleUnit || (order.items && order.items.length > 0 ? order.items[0].unit : ''))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.purchasePrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(order.salePrice)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${order.profit && order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {order.profit && order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'COMPLETED' ? 'Hoàn thành' : 
                         order.status === 'PENDING' ? 'Chờ xử lý' : 
                         order.status === 'CANCELLED' ? 'Đã hủy' : order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => handleEdit(order)} className="text-gray-500 hover:text-gray-700" title="Chi tiết">
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {canUpdate ? (
                          <button onClick={() => handleEdit(order)} className="text-indigo-600 hover:text-indigo-900" title="Sửa">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        ) : (
                          <button disabled className="text-gray-300 cursor-not-allowed" title="Không có quyền sửa">
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(order.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
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

      <OrderForm  
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        order={selectedOrder}
        customers={customers}
      />
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { updateProduct } from '@/lib/apiActions';
import toast from 'react-hot-toast';
import ImportStockModal from '../inventory/ImportStockModal';
import AdjustStockModal from '../inventory/AdjustStockModal';
import InventoryHistoryModal from '../inventory/InventoryHistoryModal';
import ProductFormModal from './ProductFormModal';
import { useSearchParams } from 'react-router-dom';
import { useRouter, usePathname } from '@/hooks/useRouter';
import Pagination from '@/components/ui/Pagination';
import SortableHeader from '@/components/ui/SortableHeader';

interface ProductListClientProps {
  products: any[];
  suppliers?: any[];
  userRole?: string;
  pagination?: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export default function ProductListClient(props: ProductListClientProps) {
  const { products: initialProducts, suppliers = [], userRole } = props;
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', type: 'STANDARD', baseUnit: 'cái', buyPrice: '', sellPrice: '', stockQty: '' });
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [historyProduct, setHistoryProduct] = useState<any | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);

  const canEdit = userRole === 'ADMIN' || userRole === 'ACCOUNTANT';

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      type: product.type || 'STANDARD',
      baseUnit: product.baseUnit || 'cái',
      buyPrice: product.buyPrice.toString(),
      sellPrice: product.sellPrice.toString(),
      stockQty: product.stockQty.toString(),
    });
  };

  const handleSave = async (id: string) => {
    setLoading(true);
    try {
      const payload = {
        name: editForm.name,
        type: editForm.type as any,
        baseUnit: editForm.baseUnit,
        buyPrice: Number(editForm.buyPrice),
        sellPrice: Number(editForm.sellPrice),
        stockQty: Number(editForm.stockQty),
      };

      const res = await updateProduct(id, payload);
      if (res.success) {
        toast.success('Cập nhật sản phẩm thành công');
        setProducts(products.map(p => p.id === id ? { ...p, ...payload } : p));
        setEditingId(null);
      } else {
        toast.error(res.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Kho hàng</h1>
          <p className="mt-2 text-sm text-gray-700">Danh sách các sản phẩm và combo hiện có trong kho.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
          {canEdit && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 sm:w-auto"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nhập Hàng Mới
              </button>
              <button
                onClick={() => setIsProductFormOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 sm:w-auto"
              >
                + Sản phẩm mới
              </button>
              <Link
                href="/products/combos/new"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
              >
                Tạo Combo mới
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">STT</th>
                <SortableHeader columnKey="name" title="Tên sản phẩm" className="!font-semibold !text-gray-900 !text-sm" />
                <SortableHeader columnKey="sku" title="SKU" className="!font-semibold !text-gray-900 !text-sm" />
                <SortableHeader columnKey="type" title="Loại" className="!font-semibold !text-gray-900 !text-sm" />
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Đơn vị tính</th>
                <SortableHeader columnKey="stockQty" title="Tồn kho" align="right" className="!font-semibold !text-gray-900 !text-sm w-28" />
                <SortableHeader columnKey="buyPrice" title="Giá nhập" align="right" className="!font-semibold !text-gray-900 !text-sm w-36" />
                <SortableHeader columnKey="sellPrice" title="Giá bán" align="right" className="!font-semibold !text-gray-900 !text-sm w-36" />
                {canEdit && <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 w-24">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="py-8 text-center text-gray-500">Chưa có sản phẩm nào.</td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const isEditing = editingId === product.id;
                  const stt = props.pagination ? (props.pagination.page - 1) * props.pagination.limit + index + 1 : index + 1;
                  
                  return (
                    <tr key={product.id} className={isEditing ? 'bg-primary-50/50' : 'hover:bg-gray-50'}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                        {stt}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          product.name
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{product.sku}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {isEditing ? (
                          <select
                            value={editForm.type}
                            onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="STANDARD">Cơ bản</option>
                            <option value="COMBO">Combo</option>
                          </select>
                        ) : (
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${product.type === 'COMBO' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                            {product.type === 'COMBO' ? 'Combo' : 'Cơ bản'}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.baseUnit}
                            onChange={(e) => setEditForm({...editForm, baseUnit: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-gray-900">{product.baseUnit}</span>
                            {product.units?.length > 0 && (
                              <span className="text-xs text-gray-500">
                                + {product.units.map((u: any) => `${u.unitName} (${u.conversionRatio})`).join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editForm.stockQty}
                              onChange={(e) => setEditForm({...editForm, stockQty: e.target.value})}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                            />
                            <span>{product.baseUnit}</span>
                          </div>
                        ) : (
                          `${product.stockQty} ${product.baseUnit}`
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.buyPrice}
                            onChange={(e) => setEditForm({...editForm, buyPrice: e.target.value})}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <span className="text-gray-500">{Number(product.buyPrice).toLocaleString('vi-VN')} ₫</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right font-medium">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.sellPrice}
                            onChange={(e) => setEditForm({...editForm, sellPrice: e.target.value})}
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        ) : (
                          <span className="text-primary-600">{Number(product.sellPrice).toLocaleString('vi-VN')} ₫</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium">
                          {isEditing ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSave(product.id)}
                                disabled={loading}
                                className="text-green-600 hover:text-green-900"
                              >
                                Lưu
                              </button>
                              <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-3 items-center">
                              <button
                                onClick={() => setHistoryProduct(product)}
                                className="text-gray-500 hover:text-gray-900"
                                title="Lịch sử kho"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setAdjustingProduct(product)}
                                className="text-orange-500 hover:text-orange-700"
                                title="Điều chỉnh kho"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEdit(product)}
                                className="text-primary-600 hover:text-primary-900"
                                title="Chỉnh sửa nhanh"
                              >
                                Sửa
                              </button>
                            </div>
                          )}
                        </td>
                      )}
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

      <ImportStockModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        products={products}
        suppliers={suppliers}
      />

      <AdjustStockModal 
        isOpen={!!adjustingProduct} 
        onClose={() => setAdjustingProduct(null)} 
        product={adjustingProduct}
      />

      <InventoryHistoryModal 
        isOpen={!!historyProduct} 
        onClose={() => setHistoryProduct(null)} 
        productId={historyProduct?.id}
        productName={historyProduct?.name}
      />

      <ProductFormModal 
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        onSuccess={(newProduct) => {
          setProducts([newProduct, ...products]);
        }}
      />
    </div>
  );
}

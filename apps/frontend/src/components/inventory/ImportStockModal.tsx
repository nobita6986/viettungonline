'use client';

import React, { useState } from 'react';
import { importStock } from '@/lib/apiActions';
import { addProductUnit } from '@/lib/apiActions';
import toast from 'react-hot-toast';
import ProductFormModal from '../products/ProductFormModal';

interface Product {
  id: string;
  name: string;
  baseUnit: string;
  units: { unitName: string; conversionRatio: number }[];
}

interface ImportStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: any[];
}

export default function ImportStockModal({ isOpen, onClose, products: initialProducts, suppliers }: ImportStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState(initialProducts);
  const [formData, setFormData] = useState({
    supplierId: '',
    note: ''
  });
  
  const [items, setItems] = useState([{ productId: '', qty: 1, unitName: '', buyPrice: 0 }]);
  
  // State for creating new unit
  const [creatingUnitFor, setCreatingUnitFor] = useState<number | null>(null); // index of item
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitRatio, setNewUnitRatio] = useState<number>(1);
  const [isAddingUnit, setIsAddingUnit] = useState(false);

  // State for creating new product
  const [creatingProductFor, setCreatingProductFor] = useState<number | null>(null); // index of item

  // Update products when initialProducts changes
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { productId: '', qty: 1, unitName: '', buyPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (creatingUnitFor === index) {
      setCreatingUnitFor(null);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value,
        unitName: product ? product.baseUnit : ''
      };
      if (creatingUnitFor === index) setCreatingUnitFor(null);
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const handleCreateUnit = async (index: number) => {
    const item = items[index];
    if (!item.productId || !newUnitName.trim() || newUnitRatio <= 0) {
      toast.error('Vui lòng nhập tên đơn vị và tỷ lệ quy đổi hợp lệ (Lớn hơn 0)');
      return;
    }

    setIsAddingUnit(true);
    try {
      const res = await addProductUnit(item.productId, newUnitName.trim(), newUnitRatio);
      if (res.success) {
        toast.success('Đã thêm đơn vị tính mới');
        
        // Update local products state
        const updatedProducts = products.map(p => {
          if (p.id === item.productId) {
            return {
              ...p,
              units: [...p.units, { unitName: newUnitName.trim(), conversionRatio: newUnitRatio }]
            };
          }
          return p;
        });
        setProducts(updatedProducts);
        
        // Auto select the new unit
        handleItemChange(index, 'unitName', newUnitName.trim());
        
        // Reset form
        setCreatingUnitFor(null);
        setNewUnitName('');
        setNewUnitRatio(1);
      } else {
        toast.error(res.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error('Lỗi hệ thống');
    } finally {
      setIsAddingUnit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.productId || i.qty <= 0 || i.buyPrice < 0)) {
      toast.error('Vui lòng điền đầy đủ và hợp lệ thông tin sản phẩm');
      return;
    }

    setLoading(true);
    try {
      const res = await importStock({
        supplierId: formData.supplierId || undefined,
        note: formData.note,
        items
      });

      if (res.success) {
        toast.success('Nhập kho thành công');
        onClose();
      } else {
        toast.error(res.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error('Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl mx-auto my-8">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-100 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Tạo Đơn Nhập Hàng</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={formData.supplierId}
                onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
              >
                <option value="">-- Chọn Nhà cung cấp --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                placeholder="VD: Nhập hàng đợt 1..."
              />
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Danh sách sản phẩm</h3>
            <div className="space-y-3">
              {items.map((item, idx) => {
                const product = products.find(p => p.id === item.productId);
                const availableUnits = product ? [product.baseUnit, ...product.units.map(u => u.unitName)] : [];

                return (
                  <div key={idx} className="flex flex-col gap-2 border p-3 rounded-lg bg-gray-50 relative">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs text-gray-500">Sản phẩm *</label>
                          <button 
                            type="button" 
                            onClick={() => setCreatingProductFor(idx)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 flex items-center"
                          >
                            + Thêm SP
                          </button>
                        </div>
                        <select
                          required
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                          value={item.productId}
                          onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        >
                          <option value="">Chọn sản phẩm</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="block text-xs text-gray-500 mb-1">Số lượng *</label>
                        <input
                          type="number"
                          required min="1"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                        />
                      </div>
                      <div className="w-40">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs text-gray-500">Đơn vị *</label>
                          {creatingUnitFor !== idx && (
                            <button 
                              type="button" 
                              onClick={() => {
                                if (!item.productId) {
                                  toast.error('Vui lòng chọn sản phẩm trước');
                                  return;
                                }
                                setCreatingUnitFor(idx);
                              }}
                              className="text-[10px] text-primary-600 hover:text-primary-800 flex items-center"
                            >
                              + Tạo mới
                            </button>
                          )}
                        </div>
                        <select
                          required
                          disabled={!item.productId}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-400"
                          value={item.unitName}
                          onChange={(e) => handleItemChange(idx, 'unitName', e.target.value)}
                        >
                          {!item.productId ? (
                            <option value="">Chọn SP trước</option>
                          ) : (
                            availableUnits.map(u => <option key={u} value={u}>{u}</option>)
                          )}
                        </select>
                      </div>
                      <div className="w-36">
                        <label className="block text-xs text-gray-500 mb-1">Giá nhập (VNĐ) *</label>
                        <input
                          type="number"
                          required min="0"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-primary-500"
                          value={item.buyPrice}
                          onChange={(e) => handleItemChange(idx, 'buyPrice', Number(e.target.value))}
                        />
                      </div>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="mt-5 text-red-500 hover:text-red-700"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {creatingUnitFor === idx && product && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-md flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-blue-800 mb-1">Tên đơn vị mới (VD: Thùng, Hộp...)</label>
                          <input
                            type="text"
                            placeholder="Tên đơn vị..."
                            className="w-full px-2 py-1 text-sm border border-blue-200 rounded outline-none focus:border-blue-400"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-blue-800 mb-1">Tỷ lệ quy đổi (1 Đơn vị này = ? {product.baseUnit})</label>
                          <input
                            type="number"
                            min="1"
                            className="w-full px-2 py-1 text-sm border border-blue-200 rounded outline-none focus:border-blue-400"
                            value={newUnitRatio}
                            onChange={(e) => setNewUnitRatio(Number(e.target.value))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleCreateUnit(idx)}
                            disabled={isAddingUnit}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setCreatingUnitFor(null)}
                            className="px-3 py-1 bg-white text-gray-600 border border-gray-300 text-sm rounded hover:bg-gray-50"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-3 text-sm text-primary-600 font-medium hover:text-primary-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm dòng
            </button>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Đang lưu...' : 'Nhập Kho'}
            </button>
          </div>
        </form>
      </div>

      <ProductFormModal
        isOpen={creatingProductFor !== null}
        onClose={() => setCreatingProductFor(null)}
        onSuccess={(newProduct) => {
          const productWithUnits = { ...newProduct, units: newProduct.units || [] };
          setProducts([productWithUnits, ...products]);
          if (creatingProductFor !== null) {
            handleItemChange(creatingProductFor, 'productId', productWithUnits.id);
            if (productWithUnits.buyPrice) {
              handleItemChange(creatingProductFor, 'buyPrice', productWithUnits.buyPrice);
            }
          }
          setCreatingProductFor(null);
        }}
      />
    </div>
  );
}

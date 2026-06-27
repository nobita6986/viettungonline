'use client';

import React, { useState, useEffect } from 'react';
import { createOrder, updateOrder } from '@/lib/apiActions';
import { createCustomer } from '@/lib/apiActions';
import toast from 'react-hot-toast';

interface OrderFormProps {
  order?: any;
  customers: any[];
  isOpen: boolean;
  onClose: () => void;
}

const parseDateForInput = (dateString?: string) => {
  if (!dateString) return '';
  return dateString.split('T')[0];
};

export default function OrderForm({ order, customers, isOpen, onClose }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  
  // State quản lý Form Data với đầy đủ các trường
  const [formData, setFormData] = useState({
    productName: '',
    
    // Purchase fields
    purchaseDate: new Date().toISOString().split('T')[0],
    receivedDate: '',
    purchaseUnit: 'cái',
    purchaseQty: 1,
    purchaseUnitPrice: '',
    purchaseStatus: 'PENDING',
    
    // Sale fields
    customerId: '',
    saleDate: new Date().toISOString().split('T')[0],
    expectedDate: '',
    deliveredDate: '',
    saleUnit: 'cái',
    saleQty: 1,
    saleUnitPrice: '',
    saleStatus: 'PENDING',
    
    // Chung
    notes: '',
    status: 'PENDING'
  });

  const [localCustomers, setLocalCustomers] = useState(customers);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerType, setNewCustomerType] = useState('RETAIL');
  const [addingCustomerLoading, setAddingCustomerLoading] = useState(false);

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  useEffect(() => {
    if (order && isOpen) {
      const pQty = order.purchaseQty || 1;
      const sQty = order.saleQty || pQty;
      
      const pTotal = order.purchasePrice ? Number(order.purchasePrice) : 0;
      const sTotal = order.salePrice ? Number(order.salePrice) : 0;
      
      setFormData({
        productName: order.items && order.items.length > 0 ? order.items[0].productName : '',
        
        purchaseDate: parseDateForInput(order.purchaseDate) || parseDateForInput(order.createdAt),
        receivedDate: parseDateForInput(order.receivedDate),
        purchaseUnit: order.purchaseUnit || 'cái',
        purchaseQty: pQty,
        purchaseUnitPrice: pTotal > 0 ? (pTotal / pQty).toString() : '',
        purchaseStatus: order.purchaseStatus || 'PENDING',
        
        customerId: order.customerId || '',
        saleDate: parseDateForInput(order.saleDate) || parseDateForInput(order.createdAt),
        expectedDate: parseDateForInput(order.expectedDate),
        deliveredDate: parseDateForInput(order.deliveredDate),
        saleUnit: order.saleUnit || order.purchaseUnit || 'cái',
        saleQty: sQty,
        saleUnitPrice: sTotal > 0 ? (sTotal / sQty).toString() : '',
        saleStatus: order.saleStatus || 'PENDING',
        
        notes: order.notes || '',
        status: order.status || 'PENDING'
      });
    } else if (isOpen) {
      setFormData({
        productName: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        receivedDate: '',
        purchaseUnit: 'cái',
        purchaseQty: 1,
        purchaseUnitPrice: '',
        purchaseStatus: 'PENDING',
        
        customerId: '',
        saleDate: new Date().toISOString().split('T')[0],
        expectedDate: '',
        deliveredDate: '',
        saleUnit: 'cái',
        saleQty: 1,
        saleUnitPrice: '',
        saleStatus: 'PENDING',
        
        notes: '',
        status: 'PENDING'
      });
    }
  }, [order, isOpen]);

  if (!isOpen) return null;

  // Auto-sync sale qty and unit when purchase qty/unit changes
  const handlePurchaseQtyChange = (val: number) => {
    setFormData(prev => ({
      ...prev,
      purchaseQty: val,
      saleQty: prev.saleQty === prev.purchaseQty ? val : prev.saleQty
    }));
  };

  const handlePurchaseUnitChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      purchaseUnit: val,
      saleUnit: prev.saleUnit === prev.purchaseUnit ? val : prev.saleUnit
    }));
  };

  // Tính toán Tổng tiền
  const totalPurchase = (Number(formData.purchaseUnitPrice) || 0) * formData.purchaseQty;
  const totalSale = (Number(formData.saleUnitPrice) || 0) * formData.saleQty;
  const expectedProfit = totalSale - totalPurchase;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        productName: formData.productName,
        
        purchaseDate: formData.purchaseDate || undefined,
        receivedDate: formData.receivedDate || undefined,
        purchaseUnit: formData.purchaseUnit,
        purchaseQty: formData.purchaseQty,
        purchasePrice: totalPurchase, // Truyền Tổng Tiền Mua vào payload
        purchaseStatus: formData.purchaseStatus as any,
        
        customerId: formData.customerId || undefined,
        saleDate: formData.saleDate || undefined,
        expectedDate: formData.expectedDate || undefined,
        deliveredDate: formData.deliveredDate || undefined,
        saleUnit: formData.saleUnit,
        saleQty: formData.saleQty,
        salePrice: totalSale, // Truyền Tổng Tiền Bán vào payload
        saleStatus: formData.saleStatus as any,
        
        notes: formData.notes,
        status: formData.status as any
      };

      let res;
      if (order?.id) {
        res = await updateOrder(order.id, payload);
      } else {
        res = await createOrder(payload);
      }

      if (res?.success) {
        toast.success(order ? 'Cập nhật đơn hàng thành công!' : 'Tạo đơn hàng thành công!');
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

  const handleQuickAddCustomer = async () => {
    if (!newCustomerName.trim()) {
      toast.error('Vui lòng nhập tên đối tác');
      return;
    }
    setAddingCustomerLoading(true);
    try {
      const res = await createCustomer({
        name: newCustomerName,
        phone: newCustomerPhone,
        type: newCustomerType as any,
      });
      if (res.success) {
        toast.success('Thêm đối tác thành công!');
        setLocalCustomers([...localCustomers, res.data]);
        setFormData({ ...formData, customerId: res.data.id });
        setIsAddingCustomer(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
      } else {
        toast.error(res.error || 'Lỗi khi thêm đối tác');
      }
    } catch (err) {
      toast.error('Lỗi hệ thống');
    } finally {
      setAddingCustomerLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-5xl mx-auto my-8 flex flex-col max-h-[90vh]">
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-4 border-b border-gray-100 rounded-t-xl shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {order ? `Chi tiết Đơn hàng: ${order.orderCode}` : 'Thêm Đơn hàng Mới (Split View)'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-1 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          <form id="order-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Header: Chung */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cửa nhôm Xingfa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái chung</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="PENDING">Chờ xử lý</option>
                    <option value="PROCESSING">Đang xử lý</option>
                    <option value="COMPLETED">Hoàn thành (Đã thanh toán)</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Split View: Purchase vs Sales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* CỘT TRÁI: MUA HÀNG */}
              <div className="space-y-4 border border-orange-200 bg-orange-50/30 rounded-xl p-4">
                <h3 className="font-semibold text-orange-800 border-b border-orange-200 pb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Thông tin Mua hàng (Đầu vào)
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đặt hàng</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày nhận hàng</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.receivedDate}
                      onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng mua *</label>
                    <input
                      type="number"
                      required min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                      value={formData.purchaseQty}
                      onChange={(e) => handlePurchaseQtyChange(Number(e.target.value))}
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      value={formData.purchaseUnit}
                      onChange={(e) => handlePurchaseUnitChange(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá MUA (VNĐ) *</label>
                  <input
                    type="number"
                    required min="0"
                    placeholder="VD: 1200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-orange-900 font-medium"
                    value={formData.purchaseUnitPrice}
                    onChange={(e) => setFormData({ ...formData, purchaseUnitPrice: e.target.value })}
                  />
                  <div className="mt-2 p-2 bg-orange-100 rounded text-orange-800 text-sm font-semibold flex justify-between">
                    <span>Tổng mua:</span>
                    <span>{totalPurchase.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thanh toán (Mua)</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    value={formData.purchaseStatus}
                    onChange={(e) => setFormData({ ...formData, purchaseStatus: e.target.value })}
                  >
                    <option value="PENDING">Chưa thanh toán</option>
                    <option value="PAID">Đã thanh toán</option>
                  </select>
                </div>
              </div>

              {/* CỘT PHẢI: BÁN HÀNG */}
              <div className="space-y-4 border border-blue-200 bg-blue-50/30 rounded-xl p-4">
                <h3 className="font-semibold text-blue-800 border-b border-blue-200 pb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Thông tin Bán hàng (Đầu ra)
                </h3>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Khách hàng / Đối tác</label>
                    {!isAddingCustomer && (
                      <button 
                        type="button" 
                        onClick={() => setIsAddingCustomer(true)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        + Thêm nhanh
                      </button>
                    )}
                  </div>
                  
                  {isAddingCustomer ? (
                    <div className="p-3 bg-white border border-blue-200 rounded-lg space-y-2 mb-2 shadow-inner">
                      <input 
                        type="text" 
                        placeholder="Tên đối tác *" 
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500"
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Số điện thoại" 
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500"
                          value={newCustomerPhone}
                          onChange={e => setNewCustomerPhone(e.target.value)}
                        />
                        <select 
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded outline-none focus:border-blue-500"
                          value={newCustomerType}
                          onChange={e => setNewCustomerType(e.target.value)}
                        >
                          <option value="RETAIL">Khách lẻ</option>
                          <option value="WHOLESALE">Khách buôn</option>
                          <option value="BUYER">Người mua</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={handleQuickAddCustomer}
                          disabled={addingCustomerLoading}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {addingCustomerLoading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setIsAddingCustomer(false)}
                          className="px-3 py-1 bg-white text-gray-600 border border-gray-300 text-sm rounded hover:bg-gray-50"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    >
                      <option value="">-- Chọn khách hàng --</option>
                      {localCustomers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày dự kiến (KPI)</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.expectedDate}
                      onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày giao thực tế</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.deliveredDate}
                      onChange={(e) => setFormData({ ...formData, deliveredDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng bán *</label>
                    <input
                      type="number"
                      required min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                      value={formData.saleQty}
                      onChange={(e) => setFormData({ ...formData, saleQty: Number(e.target.value) })}
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.saleUnit}
                      onChange={(e) => setFormData({ ...formData, saleUnit: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn giá BÁN (VNĐ) *</label>
                  <input
                    type="number"
                    required min="0"
                    placeholder="VD: 1630"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 font-medium"
                    value={formData.saleUnitPrice}
                    onChange={(e) => setFormData({ ...formData, saleUnitPrice: e.target.value })}
                  />
                  <div className="mt-2 p-2 bg-blue-100 rounded text-blue-800 text-sm font-semibold flex justify-between">
                    <span>Tổng bán:</span>
                    <span>{totalSale.toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thanh toán (Bán)</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.saleStatus}
                    onChange={(e) => setFormData({ ...formData, saleStatus: e.target.value })}
                  >
                    <option value="PENDING">Chưa thu tiền</option>
                    <option value="PAID">Đã thu tiền</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            
          </form>
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-4 rounded-b-xl flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">Dự kiến Lợi nhuận:</span>
            <span className={`text-xl font-bold ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {expectedProfit > 0 ? '+' : ''}{expectedProfit.toLocaleString('vi-VN')} ₫
            </span>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="order-form"
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
            >
              {loading && (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {order ? 'Cập nhật Đơn hàng' : 'Tạo Đơn hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRouter, usePathname } from '@/hooks/useRouter';
import { useComboStore } from '@/stores/useComboStore';

export default function ComboForm() {
  const router = useRouter();
  
  // Zustand store
  const components = useComboStore(state => state.components);
  const addComponent = useComboStore(state => state.addComponent);
  const removeComponent = useComboStore(state => state.removeComponent);
  const updateQuantity = useComboStore(state => state.updateQuantity);
  const clearComponents = useComboStore(state => state.clearComponents);
  const getTotalBuyPrice = useComboStore(state => state.getTotalBuyPrice);
  const getMaxComboAvailable = useComboStore(state => state.getMaxComboAvailable);

  // Local state for Form
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [baseUnit, setBaseUnit] = useState('Combo');
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear store on unmount
  useEffect(() => {
    return () => clearComponents();
  }, [clearComponents]);

  // Handle Search
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?search=${searchQuery}&type=STANDARD`);
        const json = await res.json();
        if (json.success) setSearchResults(json.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (components.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thành phần cho Combo!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        sku,
        type: 'COMBO',
        baseUnit,
        buyPrice: getTotalBuyPrice(),
        sellPrice: sellPrice,
        components: components.map(c => ({
          componentId: c.componentId,
          quantity: c.quantity
        }))
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        alert('Tạo Combo thành công!');
        router.push('/products');
      } else {
        alert('Lỗi: ' + json.message);
      }
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi hệ thống');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen text-gray-900 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Thiết kế Combo Mới
            </h1>
            <p className="text-gray-500 mt-2">Kéo thả hoặc tìm kiếm để thêm thành phần. Hệ thống tự động tính tồn kho tối đa.</p>
          </div>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors border border-gray-300 shadow-sm"
          >
            Quay lại
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* CỘT TRÁI: Thông tin chung & Tìm kiếm */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Thông tin Combo
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên Combo *</label>
                  <input 
                    required 
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
                    placeholder="VD: Combo Quà Tặng Tết 2026"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã SKU *</label>
                    <input 
                      required 
                      value={sku} onChange={e => setSku(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                      placeholder="VD: CBO-TET26"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị *</label>
                    <input 
                      required 
                      value={baseUnit} onChange={e => setBaseUnit(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Tìm kiếm nguyên liệu
              </h2>
              
              <div className="relative mb-4">
                <input 
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-green-500 transition-all outline-none"
                  placeholder="Nhập tên hoặc mã SKU sản phẩm lẻ..."
                />
                <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {searchResults.length === 0 && searchQuery.length >= 2 && (
                  <p className="text-gray-500 text-sm text-center py-4">Không tìm thấy sản phẩm nào</p>
                )}
                {searchResults.map(prod => (
                  <div key={prod.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group">
                    <div>
                      <p className="font-medium text-gray-900">{prod.name}</p>
                      <p className="text-xs text-gray-500">Kho: <span className="text-green-600 font-semibold">{prod.stockQty}</span> {prod.baseUnit} • Giá: {Number(prod.buyPrice).toLocaleString()}đ</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addComponent({
                        componentId: prod.id,
                        name: prod.name,
                        sku: prod.sku,
                        stockQty: prod.stockQty,
                        buyPrice: Number(prod.buyPrice)
                      })}
                      className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Bill of Materials & Tính toán */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex-grow flex flex-col">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-gray-900">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Thành phần Combo (Bill of Materials)
              </h2>

              <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-[300px]">
                {components.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                    <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <p>Chưa có thành phần nào.</p>
                    <p className="text-sm">Hãy tìm kiếm và thêm từ cột bên trái.</p>
                  </div>
                ) : (
                  components.map((c) => (
                    <div key={c.componentId} className="bg-gray-50 rounded-lg p-4 flex items-center gap-4 border border-gray-200 relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                      <div className="flex-grow">
                        <h3 className="font-medium text-gray-900 text-lg">{c.name}</h3>
                        <div className="flex gap-4 mt-1 text-sm">
                          <span className="text-gray-500">Mã: {c.sku}</span>
                          <span className="text-green-600">Tồn kho: {c.stockQty}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white rounded-lg border border-gray-300">
                          <button type="button" onClick={() => updateQuantity(c.componentId, c.quantity - 1)} className="px-3 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg transition-colors">-</button>
                          <input 
                            type="number" min="1"
                            value={c.quantity}
                            onChange={(e) => updateQuantity(c.componentId, parseInt(e.target.value) || 1)}
                            className="w-12 text-center bg-transparent border-none text-gray-900 focus:ring-0 p-0 text-sm font-semibold outline-none"
                          />
                          <button type="button" onClick={() => updateQuantity(c.componentId, c.quantity + 1)} className="px-3 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg transition-colors">+</button>
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => removeComponent(c.componentId)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 border-b border-gray-200 pb-4">Định giá & Tồn kho</h2>
              
              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Tồn kho khả dụng (Ước tính)</p>
                  <p className="text-4xl font-bold text-green-600">
                    {getMaxComboAvailable()} <span className="text-base font-normal text-gray-500">combo</span>
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Tổng giá vốn</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {getTotalBuyPrice().toLocaleString()} <span className="text-base font-normal text-gray-500">đ</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá Bán Niêm Yết (VNĐ) *</label>
                <div className="relative">
                  <input 
                    required type="number" min="0"
                    value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg pl-6 pr-12 py-4 text-2xl font-bold text-gray-900 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                  />
                  <span className="absolute right-4 top-4 text-gray-500 text-xl">đ</span>
                </div>
                {sellPrice > 0 && sellPrice < getTotalBuyPrice() && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Cảnh báo: Giá bán đang thấp hơn tổng giá vốn!
                  </p>
                )}
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={isSubmitting || components.length === 0}
                  className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-sm transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Lưu Combo Sản Phẩm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 20px; }
      `}} />
    </div>
  );
}

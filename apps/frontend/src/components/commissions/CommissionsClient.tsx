'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { createCommissionRule, updateCommissionRule, deleteCommissionRule, calculatePayout, markPayoutAsPaid } from '@/lib/apiActions';
import toast from 'react-hot-toast';
import { PlusIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import CommissionRuleModal from './CommissionRuleModal';

interface Props {
  initialRules: any[];
  initialPayouts: any[];
  users: any[];
  currentUser: any;
}

export default function CommissionsClient({ initialRules, initialPayouts, users, currentUser }: Props) {
  const [activeTab, setActiveTab] = useState<'PAYOUTS' | 'RULES'>('PAYOUTS');
  const [rules, setRules] = useState(initialRules);
  const [payouts, setPayouts] = useState(initialPayouts);

  // States for Payout Calculation
  const [calcUserId, setCalcUserId] = useState('');
  const [calcMonth, setCalcMonth] = useState(new Date().getMonth() + 1);
  const [calcYear, setCalcYear] = useState(new Date().getFullYear());
  const [isCalculating, setIsCalculating] = useState(false);

  // Modal state
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

  const handleAddRule = async (data: { name: string; minAmount: number; rateType: 'PERCENT' | 'FIXED'; rateValue: number }) => {
    const res = await createCommissionRule({
      name: data.name,
      targetType: 'REVENUE',
      minAmount: data.minAmount,
      ratePercent: data.rateType === 'PERCENT' ? data.rateValue : 0,
      fixedAmount: data.rateType === 'FIXED' ? data.rateValue : 0,
      isActive: true,
    });

    if (res.success && res.data) {
      toast.success('Thêm thành công');
      setRules([...rules, res.data].sort((a, b) => Number(a.minAmount) - Number(b.minAmount)));
    } else {
      toast.error(res.error || 'Lỗi');
      throw new Error(res.error);
    }
  };

  const handleDeleteRule = (id: string) => {
    toast((t) => (
      <div>
        <p className="mb-3 font-medium text-gray-900">Bạn có chắc chắn muốn xóa quy tắc này?</p>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const res = await deleteCommissionRule(id);
              if (res.success) {
                toast.success('Xóa thành công');
                setRules(rules.filter(r => r.id !== id));
              } else toast.error(res.error || 'Lỗi');
            }} 
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
          >
            Xóa
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleCalculate = async () => {
    if (!calcUserId) return toast.error('Vui lòng chọn nhân viên');
    setIsCalculating(true);
    try {
      const res = await calculatePayout(calcUserId, calcMonth, calcYear);
      if (res.success && res.data) {
        toast.success('Tính toán thành công');
        const existingIdx = payouts.findIndex(p => p.id === res.data.id);
        if (existingIdx >= 0) {
          const newPayouts = [...payouts];
          newPayouts[existingIdx] = res.data;
          setPayouts(newPayouts);
        } else {
          setPayouts([res.data, ...payouts]);
        }
      } else {
        toast.error(res.error || 'Lỗi tính toán');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const handleMarkPaid = (id: string) => {
    toast((t) => (
      <div>
        <p className="mb-3 font-medium text-gray-900">Đánh dấu bảng kê này đã thanh toán?</p>
        <div className="flex gap-2 justify-end">
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const res = await markPayoutAsPaid(id);
              if (res.success && res.data) {
                toast.success('Đã thanh toán');
                setPayouts(payouts.map(p => p.id === id ? res.data : p));
              } else {
                toast.error(res.error || 'Lỗi');
              }
            }} 
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
          >
            Đồng ý
          </button>
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm transition-colors"
          >
            Hủy
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hoa hồng & Doanh số</h1>
          <p className="mt-1 text-sm text-gray-600">
            Cấu hình mức hoa hồng và chốt doanh số tính lương nhân viên hàng tháng.
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('PAYOUTS')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'PAYOUTS'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Bảng kê Hoa hồng (Payouts)
          </button>
          <button
            onClick={() => setActiveTab('RULES')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'RULES'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cấu hình Mức Hoa hồng
          </button>
        </nav>
      </div>

      {activeTab === 'RULES' && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-base font-medium text-gray-900">Danh sách quy tắc (Rules)</h3>
            <button onClick={() => setIsRuleModalOpen(true)} className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded flex items-center hover:bg-primary-700">
              <PlusIcon className="w-4 h-4 mr-1" /> Thêm quy tắc
            </button>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên quy tắc</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mức doanh thu tối thiểu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoa hồng (% hoặc VNĐ)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{rule.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(rule.minAmount)} VNĐ</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {rule.fixedAmount ? `${formatCurrency(rule.fixedAmount)} VNĐ/đơn` : `${rule.ratePercent}%`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleDeleteRule(rule.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Chưa cấu hình quy tắc nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'PAYOUTS' && (
        <div className="space-y-6">
          <div className="bg-white p-4 shadow-sm rounded-xl border border-gray-200 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nhân viên phụ trách</label>
              <select className="border-gray-300 rounded-md text-sm" value={calcUserId} onChange={e => setCalcUserId(e.target.value)}>
                <option value="">-- Chọn nhân viên --</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tháng</label>
              <input type="number" min="1" max="12" className="border-gray-300 rounded-md text-sm w-20" value={calcMonth} onChange={e => setCalcMonth(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Năm</label>
              <input type="number" min="2020" max="2100" className="border-gray-300 rounded-md text-sm w-24" value={calcYear} onChange={e => setCalcYear(Number(e.target.value))} />
            </div>
            <button onClick={handleCalculate} disabled={isCalculating} className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              {isCalculating ? 'Đang tính...' : 'Tính Doanh Số & Chốt'}
            </button>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kỳ (Tháng/Năm)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Doanh Số</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hoa hồng nhận</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.periodMonth}/{p.periodYear}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.user?.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{formatCurrency(p.totalSales)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">+{formatCurrency(p.commission)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {p.status === 'PAID' ? 
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Đã chi trả</span> : 
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Chưa trả</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {p.status === 'PENDING' && (
                        <button onClick={() => handleMarkPaid(p.id)} className="text-primary-600 hover:text-primary-900 font-medium">Thanh toán</button>
                      )}
                    </td>
                  </tr>
                ))}
                {payouts.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Chưa có bảng kê nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CommissionRuleModal 
        isOpen={isRuleModalOpen} 
        onClose={() => setIsRuleModalOpen(false)} 
        onSubmit={handleAddRule} 
      />
    </div>
  );
}

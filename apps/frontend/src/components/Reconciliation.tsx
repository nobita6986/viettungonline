import React, { useState } from 'react';
import { apiClient } from '@/lib/apiClient';

interface Props {
  transactionId: string;
  orderIds: string[];
  onSuccess?: () => void;
}

export const Reconciliation: React.FC<Props> = ({ transactionId, orderIds, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleReconcile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/transactions/reconcile', {
        transactionId,
        orderIds
      });
      
      if (response.data.success) {
        alert('Đã khớp lệnh với đơn hàng thành công!');
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Lỗi khớp lệnh, vui lòng thử lại!';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleReconcile} 
      disabled={loading || orderIds.length === 0}
      className={`px-4 py-2 rounded text-white font-semibold transition-colors 
        ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {loading ? 'Đang xử lý...' : 'Thực hiện khớp lệnh'}
    </button>
  );
};

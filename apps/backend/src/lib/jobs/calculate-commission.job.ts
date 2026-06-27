import { eventQueue } from './queue';
import { logger } from '../logger';

export const JOB_CALCULATE_COMMISSION = 'calculate-commission';

export interface CalculateCommissionPayload {
  userId: string;
  periodMonth: number;
  periodYear: number;
}

// Lắng nghe event và xử lý ngầm
eventQueue.on(JOB_CALCULATE_COMMISSION, async (payload: CalculateCommissionPayload) => {
  logger.info(`[Background Job] Bắt đầu tính hoa hồng cho ${payload.userId} tháng ${payload.periodMonth}/${payload.periodYear}`);
  
  try {
    // Dynamic import để tránh vòng lặp (circular dependency) hoặc tăng tốc độ load ban đầu
    const { commissionService } = await import('../../services/commission.service');
    
    // Gọi hàm tính hoa hồng thật
    await commissionService.calculateAndCreatePayout(payload.userId, payload.periodMonth, payload.periodYear);
    
    logger.info(`[Background Job] Tính hoa hồng hoàn tất cho ${payload.userId}`);
  } catch (error: any) {
    logger.error(`[Background Job] Lỗi khi tính hoa hồng cho ${payload.userId}: ${error.message}`);
    // Tại đây có thể tích hợp Retry mechanism nếu dùng hàng đợi xịn như BullMQ
  }
});

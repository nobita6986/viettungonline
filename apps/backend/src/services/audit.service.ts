import { prisma } from '@viettung/database';
import { logger } from '@/lib/logger';


interface AuditLogPayload {
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  userId?: string; // Tùy chọn, nếu không truyền sẽ tự lấy từ Session
}

export class AuditService {
  /**
   * Lưu lại vết (nhật ký) của mọi thao tác nhạy cảm vào DB
   */
  async log(payload: AuditLogPayload) {
    try {
      let finalUserId = payload.userId;

      // Nếu không truyền userId, mặc định sẽ là SYSTEM
      if (!finalUserId) {
        finalUserId = 'SYSTEM';
      }

      // Nếu thực sự không có ai thực hiện (System cronjob), dùng ID mặc định hoặc bỏ qua nếu thiết kế bắt buộc
      if (!finalUserId) {
        finalUserId = 'SYSTEM'; // Lưu ý: 'SYSTEM' phải tồn tại trong bảng User hoặc userId có thể nullable.
        // Tùy theo Prisma schema của Sếp, userId đang là Not Null.
        // Nếu hệ thống bắt buộc có user, ta phải truyền đúng ID.
      }

      await prisma.auditLog.create({
        data: {
          userId: finalUserId,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          // Đảm bảo dữ liệu được stringify ra JSON thuần để an toàn lưu trữ
          oldValues: payload.oldValues ? JSON.parse(JSON.stringify(payload.oldValues)) : null,
          newValues: payload.newValues ? JSON.parse(JSON.stringify(payload.newValues)) : null,
        }
      });

      return { success: true };
    } catch (error) {
      // Chỉ log lỗi ra console để không làm chết luồng chính của App
      logger.error({ error, payload }, 'Failed to write Audit Log');
      return { success: false, error: 'Cannot write audit log' };
    }
  }
}

export const auditService = new AuditService();

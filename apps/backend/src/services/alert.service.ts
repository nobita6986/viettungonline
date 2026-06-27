import { prisma } from '@viettung/database';
import { logger } from '@/lib/logger';

export class AlertService {
  /**
   * Quét toàn bộ sản phẩm, nếu stockQty <= ngưỡng thì tự động sinh record vào InventoryAlert
   */
  async checkAndCreateAlerts() {
    try {
      // Lấy settings, nếu chưa có thì dùng mặc định
      let settings = await prisma.inventorySettings.findFirst();
      if (!settings) {
        settings = await prisma.inventorySettings.create({
          data: {
            lowStockThreshold: 10,
            criticalThreshold: 5,
          }
        });
      }

      // Tìm tất cả sản phẩm đang có tồn kho <= ngưỡng
      const productsToAlert = await prisma.product.findMany({
        where: {
          stockQty: { lte: settings.lowStockThreshold },
          isActive: true,
          type: 'STANDARD'
        }
      });

      let newAlertsCount = 0;

      for (const product of productsToAlert) {
        const level = product.stockQty <= settings.criticalThreshold ? 'CRITICAL' : 'WARNING';
        const alertType = level === 'CRITICAL' ? 'CRITICAL_STOCK' : 'LOW_STOCK';
        
        // Tính số lượng gợi ý nhập (VD: Nhập thêm để đạt gấp 3 lần ngưỡng an toàn)
        const suggestedOrderQty = Math.max(0, (settings.lowStockThreshold * 3) - product.stockQty);

        // Kiểm tra xem đã có cảnh báo OPEN cho sản phẩm này chưa
        const existingAlert = await prisma.inventoryAlert.findFirst({
          where: { 
            productId: product.id,
            status: 'OPEN'
          }
        });

        if (!existingAlert) {
          await prisma.inventoryAlert.create({
            data: {
              productId: product.id,
              alertType,
              level,
              suggestedOrderQty,
              status: 'OPEN'
            }
          });
          newAlertsCount++;
        } else if (existingAlert.level !== level) {
          // Cập nhật mức độ cảnh báo nếu có thay đổi
          await prisma.inventoryAlert.update({
            where: { id: existingAlert.id },
            data: { level, alertType, suggestedOrderQty }
          });
        }
      }

      // Đóng các cảnh báo đã được giải quyết (hàng đã về kho)
      await prisma.inventoryAlert.updateMany({
        where: {
          status: 'OPEN',
          product: { stockQty: { gt: settings.lowStockThreshold } }
        },
        data: { status: 'RESOLVED' }
      });

      return { success: true, count: newAlertsCount };
    } catch (error) {
      logger.error({ error }, 'Error in checkAndCreateAlerts');
      return { success: false, error: 'Cannot generate alerts' };
    }
  }

  /**
   * Gom nhóm các sản phẩm đang thiếu theo từng Nhà cung cấp để gợi ý tạo Đơn nhập hàng
   */
  async generateReorderSuggestions() {
    try {
      // Lấy các cảnh báo OPEN
      const openAlerts = await prisma.inventoryAlert.findMany({
        where: { status: 'OPEN' },
        include: { product: true }
      });

      if (openAlerts.length === 0) return { success: true, data: [] };

      const productIds = openAlerts.map(a => a.productId);

      // Tìm nhà cung cấp gần nhất cho từng sản phẩm (dựa vào Order mua gần nhất)
      const lastOrders = await prisma.orderItem.findMany({
        where: {
          productId: { in: productIds },
          order: { type: 'PURCHASE' }
        },
        orderBy: { createdAt: 'desc' },
        include: { order: { include: { customer: true } } }
      });

      // Tạo map từ productId -> supplier
      const supplierMap = new Map<string, any>();
      for (const item of lastOrders) {
        if (!supplierMap.has(item.productId!) && item.order?.customer) {
          supplierMap.set(item.productId!, item.order.customer);
        }
      }

      // Gom nhóm theo supplierId
      const grouped: Record<string, any> = {};
      
      for (const alert of openAlerts) {
        const supplier = supplierMap.get(alert.productId) || { id: 'UNKNOWN', name: 'Nhà cung cấp khác / Chưa xác định' };
        
        if (!grouped[supplier.id]) {
          grouped[supplier.id] = {
            supplier,
            items: []
          };
        }

        grouped[supplier.id].items.push({
          productId: alert.productId,
          productName: alert.product.name,
          currentStock: alert.product.stockQty,
          suggestedQty: alert.suggestedOrderQty,
          level: alert.level
        });
      }

      return { success: true, data: Object.values(grouped) };
    } catch (error) {
      logger.error({ error }, 'Error in generateReorderSuggestions');
      return { success: false, error: 'Cannot generate reorder suggestions' };
    }
  }
}

export const alertService = new AlertService();

import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';
import { DecimalUtils } from '@/lib/decimal-utils';

export class MovingAverageCostService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Recalculates and updates the Moving Average Cost (MAC) for a product.
   * MAC = ((Current Stock Qty * Current MAC) + (New Stock Qty * New Unit Cost)) / (Current Stock Qty + New Stock Qty)
   */
  async updateMovingAverageCost(productId: string, incomingQty: number, incomingTotalCost: number | Decimal, tx?: any) {
    const db = tx || this.prisma;
    
    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, stockQty: true, buyPrice: true }
    });

    if (!product) throw new Error('Product not found for MAC calculation');

    // Nếu không có số lượng nhập thêm, không cần tính toán lại
    if (incomingQty <= 0) return product.buyPrice;

    const currentStockQty = Math.max(0, product.stockQty); // Ignored negative stock for valuation purposes
    const currentCostTotal = DecimalUtils.multiply(currentStockQty, product.buyPrice);
    
    const newTotalCost = DecimalUtils.add(currentCostTotal, incomingTotalCost);
    const newTotalQty = currentStockQty + incomingQty;

    const newMac = DecimalUtils.divideIfPositive(newTotalCost, newTotalQty);

    await db.product.update({
      where: { id: productId },
      data: { buyPrice: newMac }
    });

    // Option: Thông báo cho các đơn hàng đang chờ duyệt (PENDING) cập nhật giá trị vốn
    await this.notifyPendingOrdersOfCostChange(productId, newMac, db);

    return newMac;
  }

  /**
   * Tìm tất cả các đơn hàng đang PENDING có chứa sản phẩm bị ảnh hưởng, 
   * và tính toán lại giá nhập (buyPrice/buyTotal) của chúng nếu cần.
   */
  private async notifyPendingOrdersOfCostChange(productId: string, newMac: Decimal, tx: any) {
    const pendingOrderItems = await tx.orderItem.findMany({
      where: {
        productId,
        order: {
          status: 'PENDING',
          type: 'SALE'
        }
      },
      include: { order: true }
    });

    for (const item of pendingOrderItems) {
      const newBuyTotal = DecimalUtils.multiply(item.qty, newMac);
      const newProfit = DecimalUtils.subtract(item.sellTotal, newBuyTotal);

      await tx.orderItem.update({
        where: { id: item.id },
        data: {
          buyPrice: newMac,
          buyTotal: newBuyTotal,
          profit: newProfit
        }
      });

      // Cập nhật lại tổng profit của đơn hàng
      const allItems = await tx.orderItem.findMany({ where: { orderId: item.orderId } });
      const orderTotalProfit = allItems.reduce((sum: Decimal, i: any) => DecimalUtils.add(sum, i.profit), new Decimal(0));
      
      await tx.order.update({
        where: { id: item.orderId },
        data: { profit: orderTotalProfit }
      });
    }
  }
}

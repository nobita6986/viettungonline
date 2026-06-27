import { Prisma, OrderStatus, PurchaseStatus, SaleStatus } from '@prisma/client';
import { BaseService } from './base.service';
import { DecimalUtils } from '@/lib/decimal-utils';
import { generateOrderCode } from '@/lib/formatters';
import { parseDateSafe } from '@/lib/date-utils';
import { OrderNotFoundError, DomainError } from '@/domain/errors';
import { CreateOrderInput, UpdateOrderInput } from './order.service';

export class OrderCreationService extends BaseService {
  /**
   * Lấy số thứ tự đơn hàng tiếp theo cho năm hiện tại
   */
  async getNextOrderSequence(year: number): Promise<number> {
    const result = await this.prisma.$transaction(async (tx) => {
      const lastOrder = await tx.order.findFirst({
        where: { orderCode: { startsWith: `ORD-${year}-` } },
        orderBy: { orderCode: 'desc' },
        select: { orderCode: true }
      });
      
      if (!lastOrder) return 1;
      const lastSeq = parseInt(lastOrder.orderCode.split('-')[2], 10);
      return lastSeq + 1;
    }, {
      isolationLevel: 'Serializable'
    });
    return result;
  }

  /**
   * Tạo đơn hàng mới
   */
  async createOrder(data: CreateOrderInput) {
    const currentYear = this.getCurrentYear();
    const sequence = await this.getNextOrderSequence(currentYear);
    const orderCode = generateOrderCode(currentYear, sequence);

    const pQty = data.purchaseQty ?? data.qty ?? 1;
    const sQty = data.saleQty ?? data.qty ?? 1;
    const pUnit = data.purchaseUnit ?? data.unit ?? 'cái';
    const sUnit = data.saleUnit ?? data.unit ?? 'cái';

    const buyTotal = DecimalUtils.toDecimal(data.purchasePrice);
    const sellTotal = DecimalUtils.toDecimal(data.salePrice);
    
    const { ProfitCalculator } = await import('../domain/pricing/ProfitCalculator');
    const profit = ProfitCalculator.calculateOrderProfit(data.purchasePrice, data.salePrice);

    return this.withTransaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderCode,
          status: OrderStatus.PENDING,
          purchaseDate: parseDateSafe(data.purchaseDate),
          purchaseQty: pQty,
          purchaseUnit: pUnit,
          purchasePrice: buyTotal,
          purchaseStatus: data.purchaseStatus || PurchaseStatus.PENDING,
          receivedDate: parseDateSafe(data.receivedDate),
          saleDate: parseDateSafe(data.saleDate),
          saleQty: sQty,
          saleUnit: sUnit,
          salePrice: sellTotal,
          saleStatus: data.saleStatus || SaleStatus.PENDING,
          expectedDate: parseDateSafe(data.expectedDate),
          deliveredDate: parseDateSafe(data.deliveredDate),
          profit,
          notes: data.notes,
          supplierId: data.supplierId,
          customerId: data.customerId,
        },
      });

      let product = await tx.product.findFirst({
        where: { name: data.productName }
      });

      if (product) {
        const productUnitBuyPrice = DecimalUtils.divideIfPositive(data.purchasePrice, pQty);
        await tx.product.update({
          where: { id: product.id },
          data: { buyPrice: productUnitBuyPrice }
        });
      }

      const unitBuyPrice = DecimalUtils.divideIfPositive(data.purchasePrice, pQty);
      const unitSellPrice = DecimalUtils.divideIfPositive(data.salePrice, sQty);

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          productId: product ? product.id : null,
          productName: data.productName,
          unit: pUnit,
          qty: pQty,
          buyPrice: unitBuyPrice,
          buyTotal,
          sellPrice: unitSellPrice,
          sellTotal,
          profit,
        },
      });

      return order;
    });
  }

  // Chuyển processOrderShipped, cancelOrder, updateOrder... từ OrderService sang đây.
}

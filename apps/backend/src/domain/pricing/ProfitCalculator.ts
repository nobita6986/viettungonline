// src/domain/pricing/ProfitCalculator.ts
import { DecimalUtils } from '@/lib/decimal-utils';

export class ProfitCalculator {
  /**
   * Tính toán Lợi nhuận của một Order dựa trên Tổng mua và Tổng bán
   */
  static calculateOrderProfit(purchasePrice: number | string | null, salePrice: number | string | null): number {
    const buyTotal = DecimalUtils.toDecimal(purchasePrice || 0);
    const sellTotal = DecimalUtils.toDecimal(salePrice || 0);
    
    // Profit = Sale - Purchase
    const profit = DecimalUtils.subtract(sellTotal, buyTotal);
    
    return Number(profit);
  }

  /**
   * Tính toán Lợi nhuận của từng OrderItem
   */
  static calculateItemProfit(buyTotal: number | string | null, sellTotal: number | string | null): number {
    const buy = DecimalUtils.toDecimal(buyTotal || 0);
    const sell = DecimalUtils.toDecimal(sellTotal || 0);
    
    return Number(DecimalUtils.subtract(sell, buy));
  }
}

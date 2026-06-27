import { Decimal } from 'decimal.js';

export class DecimalUtils {
  static toDecimal(value: any): Decimal {
    if (value === null || value === undefined) return new Decimal(0);
    if (value instanceof Decimal) return value;
    try {
      return new Decimal(value.toString());
    } catch {
      return new Decimal(0);
    }
  }

  static toNumber(value: any): number {
    return this.toDecimal(value).toNumber();
  }

  static add(...values: any[]): Decimal {
    return values.reduce((sum: Decimal, val) => sum.plus(this.toDecimal(val)), new Decimal(0));
  }

  static subtract(a: any, b: any): Decimal {
    return this.toDecimal(a).minus(this.toDecimal(b));
  }

  static multiply(a: any, b: any): Decimal {
    return this.toDecimal(a).times(this.toDecimal(b));
  }

  static divide(a: any, b: any): Decimal {
    const divisor = this.toDecimal(b);
    if (divisor.isZero()) return new Decimal(0);
    return this.toDecimal(a).dividedBy(divisor);
  }

  static divideIfPositive(a: any, b: any): Decimal {
    const divisor = this.toDecimal(b);
    if (divisor.lessThanOrEqualTo(0)) return new Decimal(0);
    return this.toDecimal(a).dividedBy(divisor);
  }

  static formatCurrency(value: any): string {
    const num = this.toNumber(value);
    return new Intl.NumberFormat('vi-VN').format(num);
  }
}

// src/domain/errors/AppErrors.ts

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class DomainError extends AppError {
  constructor(code: string, message: string, statusCode: number = 400) {
    super(code, message, statusCode);
  }
}

// === ORDER ERRORS ===
export class OrderNotFoundError extends DomainError {
  constructor(orderId: string) {
    super(`ORDER_NOT_FOUND`, `Không tìm thấy đơn hàng: ${orderId}`, 404);
  }
}

// === INVENTORY ERRORS ===
export class InsufficientStockError extends DomainError {
  constructor(productName: string, required: number, available: number) {
    super(
      `INSUFFICIENT_STOCK`,
      `Sản phẩm "${productName}" không đủ tồn kho. Cần: ${required}, Có: ${available}`,
      400
    );
  }
}

export class ComponentNotFoundError extends DomainError {
  constructor(componentId: string, comboName: string) {
    super(
      `COMPONENT_NOT_FOUND`,
      `Thành phần ${componentId} của Combo "${comboName}" không tồn tại hoặc đã bị xóa`,
      400
    );
  }
}

export class CircularComboError extends DomainError {
  constructor(comboChain: string[]) {
    super(
      `CIRCULAR_COMBO_REFERENCE`,
      `Phát hiện Combo lồng nhau: ${comboChain.join(' → ')}`,
      400
    );
  }
}

// === FINANCIAL ERRORS ===
export class InvalidTransactionError extends DomainError {
  constructor(message: string) {
    super(`INVALID_TRANSACTION`, message, 400);
  }
}

export class CreditLimitExceededError extends DomainError {
  constructor(customerName: string, currentDebt: number, creditLimit: number, requested: number) {
    super(
      `CREDIT_LIMIT_EXCEEDED`,
      `Khách hàng "${customerName}" vượt hạn mức tín dụng. Nợ hiện tại: ${currentDebt}, Hạn mức: ${creditLimit}, Yêu cầu thêm: ${requested}`,
      400
    );
  }
}

export class AccountBalanceError extends DomainError {
  constructor(accountName: string, currentBalance: number, requiredChange: number) {
    super(
      `INSUFFICIENT_ACCOUNT_BALANCE`,
      `Tài khoản "${accountName}" không đủ số dư. Hiện tại: ${currentBalance}, Cần: ${requiredChange}`,
      400
    );
  }
}

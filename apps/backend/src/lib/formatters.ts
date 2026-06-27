import { Decimal } from 'decimal.js';
import { format, parse, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

// ============================================
// CURRENCY FORMATTERS
// ============================================

export const VND_SYMBOL = '₫';
export const VND_LOCALE = 'vi-VN';

/**
 * Format number to VND currency string
 * @example 1234567 -> "1,234,567 ₫"
 */
export function formatCurrency(amount: number | string | Decimal | null | undefined): string {
  if (amount === null || amount === undefined) return `0 ${VND_SYMBOL}`;

  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num)) return `0 ${VND_SYMBOL}`;

  return new Intl.NumberFormat(VND_LOCALE, {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Parse VND currency string to number
 * @example "1,234,567 ₫" -> 1234567
 */
export function parseCurrency(str: string | null | undefined): number {
  if (!str) return 0;
  return parseInt(str.replace(/[^\d]/g, ''), 10);
}

/**
 * Format number for display without currency symbol
 * @example 1234567 -> "1,234,567"
 */
export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return new Intl.NumberFormat(VND_LOCALE).format(n);
}

/**
 * Calculate percentage change
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

// ============================================
// DATE FORMATTERS
// ============================================

/**
 * Format date to Vietnamese format
 * @example new Date(2026, 5, 17) -> "17/06/2026"
 */
export function formatDateVN(
  date: Date | string | null | undefined,
  formatStr = 'dd/MM/yyyy'
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, formatStr, { locale: vi });
}

/**
 * Format date for display in forms
 * @example new Date(2026, 5, 17) -> "17/06/2026"
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  return formatDateVN(date, 'dd/MM/yyyy');
}

/**
 * Format date for API (ISO format)
 * @example new Date(2026, 5, 17) -> "2026-06-17"
 */
export function formatDateForAPI(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM-dd');
}

/**
 * Parse Vietnamese date string to Date object
 * @example "17/06/2026" -> new Date(2026, 5, 17)
 */
export function parseDateVN(str: string | null | undefined): Date | null {
  if (!str) return null;
  try {
    const parsed = parse(str.trim(), 'd/M/yyyy', new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Get month name in Vietnamese
 */
export function getMonthName(month: number): string {
  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
  ];
  return monthNames[month - 1] || '';
}

// ============================================
// STRING UTILITIES
// ============================================

/**
 * Generate order code
 * @example "ORD-2026-0001"
 */
export function generateOrderCode(year: number, sequence: number): string {
  return `ORD-${year}-${String(sequence).padStart(4, '0')}`;
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================
// VALIDATORS
// ============================================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(0[0-9]{9,10})$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value >= 0;
}

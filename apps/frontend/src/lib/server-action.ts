import { logger } from './logger';
import { headers } from 'next/headers';

export type ServerActionResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

// Basic in-memory rate limiting (max 30 requests per 10 seconds per IP)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW_MS = 10000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || record.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function withServerAction<T>(
  action: () => Promise<T>,
  actionName: string = 'UnnamedAction',
  errorMessage: string = 'Đã có lỗi xảy ra'
): Promise<ServerActionResponse<T>> {
  const startMs = Date.now();
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || 'unknown-ip';

  // Rate Limiting Check
  if (!checkRateLimit(ip)) {
    logger.warn({ actionName, ip }, 'Rate limit exceeded');
    return { success: false, error: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' };
  }

  try {
    logger.info({ actionName, ip }, `Action started`);
    const data = await action();
    const duration = Date.now() - startMs;
    logger.info({ actionName, durationMs: duration }, `Action completed successfully`);
    return { success: true, data };
  } catch (error: any) {
    const duration = Date.now() - startMs;
    logger.error(
      { actionName, error: error?.message, stack: error?.stack, durationMs: duration },
      `[ServerAction Error] ${errorMessage}`
    );
    return { 
      success: false, 
      error: error instanceof Error ? error.message : errorMessage 
    };
  }
}

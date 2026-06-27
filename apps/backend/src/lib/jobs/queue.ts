import { EventEmitter } from 'events';
import { logger } from '../logger';

// Sử dụng global để giữ instance khi Next.js HMR (Hot Module Replacement)
const globalForQueue = global as unknown as { eventQueue: EventEmitter };

export const eventQueue = globalForQueue.eventQueue || new EventEmitter();

if (process.env.NODE_ENV !== 'production') globalForQueue.eventQueue = eventQueue;

// Cơ chế Queue đơn giản qua EventEmitter
export function dispatchJob(eventName: string, payload: any) {
  logger.info(`[Queue] Dispatching job: ${eventName}`);
  
  // Trì hoãn thực thi một chút để trả về response API nhanh chóng (Non-blocking)
  setImmediate(() => {
    eventQueue.emit(eventName, payload);
  });
}

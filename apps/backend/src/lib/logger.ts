import pino from 'pino';

// Bỏ pino-pretty transport trong Next.js vì nó dùng worker_threads 
// gây ra lỗi crash 'the worker has exited' ở Server Actions.
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

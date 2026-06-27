import { NextResponse } from 'next/server';
import { AppError, isAppError } from './errors';
import { Prisma } from '@prisma/client';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
}

export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 200 }
  );
}

export function createdResponse<T>(data: T, message = 'Created successfully'): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status: 201 }
  );
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error);

  if (isAppError(error)) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'A record with this value already exists',
          code: 'DUPLICATE_ERROR',
        },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          success: false,
          error: 'Record not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Database operation failed',
        code: 'DB_ERROR',
      },
      { status: 500 }
    );
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid JSON',
        code: 'INVALID_JSON',
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

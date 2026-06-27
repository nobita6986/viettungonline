'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import React from 'react';

interface Props {
  columnKey: string;
  title: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export default function SortableHeader({ columnKey, title, className = '', align = 'left' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get('sortBy');
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSortBy === columnKey) {
      if (currentSortOrder === 'asc') {
        params.set('sortOrder', 'desc');
      } else {
        params.set('sortOrder', 'asc');
      }
    } else {
      params.set('sortBy', columnKey);
      params.set('sortOrder', 'desc');
    }
    params.delete('page'); // reset pagination when sorting
    router.push(`${pathname}?${params.toString()}`);
  };

  const isActive = currentSortBy === columnKey;

  const alignClass = align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start';

  return (
    <th 
      className={`px-6 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none ${isActive ? 'text-primary-700 font-bold bg-primary-50' : 'text-gray-500 bg-gray-50'} ${className}`}
      onClick={handleClick}
      title={`Sắp xếp theo ${title}`}
    >
      <div className={`flex items-center gap-1 ${alignClass}`}>
        {title}
        <span className="inline-flex w-4 items-center justify-center">
          {isActive ? (
            currentSortOrder === 'asc' ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
              </svg>
            )
          ) : (
            <svg className="w-3 h-3 text-gray-300 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          )}
        </span>
      </div>
    </th>
  );
}

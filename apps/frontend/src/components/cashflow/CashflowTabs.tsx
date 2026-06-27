'use client';

import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { 
  BriefcaseIcon, 
  ShoppingCartIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline';

interface CashflowTabsProps {
  currentTab: string;
}

export default function CashflowTabs({ currentTab }: CashflowTabsProps) {
  const tabs = [
    {
      id: 'operational',
      name: 'Thu/Chi Vận hành',
      icon: BriefcaseIcon,
      href: '/cashflow?tab=operational',
    },
    {
      id: 'trading',
      name: 'Thu/Chi Tiền hàng',
      icon: ShoppingCartIcon,
      href: '/cashflow?tab=trading',
    },
    {
      id: 'employee',
      name: 'Duyệt chi Nhân viên',
      icon: UserGroupIcon,
      href: '/cashflow?tab=employee',
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={clsx(
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <tab.icon
                className={clsx(
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500',
                  '-ml-0.5 mr-2 h-5 w-5'
                )}
                aria-hidden="true"
              />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
